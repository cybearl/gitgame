import type { FSWatcher } from "node:fs"
import COMPILE_DB_CONFIG from "@main/config/compileDb"
import { resolveBuildScriptPath, resolveEngineRoot } from "@main/lib/compileDb/engine"
import { runRegeneration } from "@main/lib/compileDb/run"
import { diffSourceFiles, scanSourceFiles } from "@main/lib/compileDb/scan"
import { resolveEditorTarget } from "@main/lib/compileDb/targets"
import { watchSourceTrees } from "@main/lib/compileDb/watch"
import CONSTANTS from "@main/lib/constants"
import { compileDbStore } from "@main/lib/stores/compileDb"
import { preferencesStore } from "@main/lib/stores/preferences"
import { readUProject } from "@main/lib/uproject/service"
import { convertErrorToMessage } from "@main/lib/utils/errors"
import type { CompileDbContext, CompileDbFileKind, CompileDbRunKind, CompileDbRunResult } from "@/main/types/compileDb"

/**
 * The compile-database watcher's lifecycle owner, holds the source-file set the
 * project was last seen with, regenerates the database whenever a file is added
 * or removed, and guards against two build-tool invocations running at once.
 */
export class CompileDbService {
    /**
     * The repository directory the watcher is bound to, `null` when stopped.
     */
    private _dir: string | null = null

    /**
     * The resolved engine, project and target the runs go through, cached because
     * resolving it reads the registry, and dropped whenever the project or the
     * engine-folder preference moves.
     */
    private _context: CompileDbContext | null = null

    /**
     * The watchers attached to the source trees, empty while auto-regeneration is
     * turned off, the manual entry point does not need them.
     */
    private _watchers: FSWatcher[] = []

    /**
     * The source files the project was last scanned with, what an incoming change
     * is diffed against to tell a new or removed file from a plain edit.
     */
    private _knownFiles = new Map<string, CompileDbFileKind>()

    /**
     * The pending settle timer, held so a burst of changes collapses into the one
     * re-scan at the end of it rather than one per event.
     */
    private _debounceTimer: NodeJS.Timeout | null = null

    /**
     * Whether a run is currently in flight.
     */
    private _isRunning = false

    /**
     * Whether a change asked for a run while another was already in flight, which
     * is replayed once that one lands so the file behind it still reaches the
     * database.
     */
    private _hasPendingRun = false

    /**
     * Whether the pending run has to be the full one, held apart from the flag
     * itself so a full run asked for mid-flight is not downgraded to a fast one.
     */
    private _isPendingRunFull = false

    /**
     * Whether auto-regeneration is turned on, mirrored off the preferences so a
     * change to an unrelated one does not tear the watchers down.
     */
    private _isEnabled = preferencesStore.get().isCompileDbAutoRegenEnabled

    /**
     * The engine folder the cached context was resolved against, compared on every
     * preference change so pointing the app at another engine drops the context.
     */
    private _engineRootOverride = preferencesStore.get().unrealEngineRoot

    /**
     * Detaches every watcher and forgets the pending settle timer, kept apart from
     * `stop` so turning auto-regeneration off can leave the project bound and the
     * manual entry point working.
     */
    private _closeWatchers() {
        for (const watcher of this._watchers) {
            watcher.close()
        }

        this._watchers = []

        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer)
            this._debounceTimer = null
        }
    }

    /**
     * Whether the last run left the database out of date, either because the build
     * tool refused the project's sources or because it could not be run at all.
     * @returns True when the last run did not land a database.
     */
    private _hasFailed(): boolean {
        const { lastResult, lastError } = compileDbStore.get()
        return Boolean(lastError) || lastResult?.ok === false
    }

    /**
     * Resolves everything a run needs and caches it, the engine folder comes from
     * the preference override or from wherever the platform records its installs,
     * and the target from the project's own editor target descriptor.
     * @returns The resolved context.
     * @throws When no project is bound, it holds no `.uproject`, or no engine
     * install could be resolved for it.
     */
    private async _ensureContext(): Promise<CompileDbContext> {
        if (this._context) return this._context
        if (!this._dir) throw new Error(CONSTANTS.compileDb.noProjectMessage)

        const uproject = await readUProject(this._dir)
        if (!uproject) throw new Error(CONSTANTS.uproject.missingFileMessage)

        const engineRoot = await resolveEngineRoot(uproject)
        const target = await resolveEditorTarget(this._dir, uproject.name)

        this._context = {
            projectRoot: this._dir,
            uprojectPath: uproject.path,
            engineRoot,
            buildScriptPath: resolveBuildScriptPath(engineRoot),
            target,
            targetPlatform:
                COMPILE_DB_CONFIG.targetPlatforms[process.platform] ?? COMPILE_DB_CONFIG.targetPlatforms.linux,
        }

        compileDbStore.set({ engineRoot, target })

        return this._context
    }

    /**
     * Runs a regeneration and records the outcome, a run asked for while another is
     * in flight is coalesced onto it rather than dropped or stacked.
     * @param kind Which regeneration to perform.
     * @returns The run's outcome, or `null` when it was coalesced or failed to start.
     */
    private async _run(kind: CompileDbRunKind): Promise<CompileDbRunResult | null> {
        if (this._isRunning) {
            this._hasPendingRun = true
            if (kind === "full") this._isPendingRunFull = true

            return null
        }

        // Cleared here rather than in the replay so the flags can only ever
        // describe a change that landed after this run committed to its scan
        this._isRunning = true
        this._hasPendingRun = false
        this._isPendingRunFull = false
        compileDbStore.set({ isRunning: true, lastError: null })

        try {
            const context = await this._ensureContext()
            const result = await runRegeneration(kind, context, label => compileDbStore.set({ runningStep: label }))

            compileDbStore.set({
                lastRunAt: new Date().toISOString(),
                lastResult: result,
                // The full run covers the solution as well, so whatever asked for
                // one has been answered
                isFullRegenSuggested: kind === "full" ? false : compileDbStore.get().isFullRegenSuggested,
            })

            return result
        } catch (error) {
            compileDbStore.set({
                lastError: convertErrorToMessage(error),
                lastRunAt: new Date().toISOString(),
            })

            return null
        } finally {
            this._isRunning = false
            compileDbStore.set({ isRunning: false, runningStep: null })

            if (this._hasPendingRun) void this._run(this._isPendingRunFull ? "full" : "fast")
        }
    }

    /**
     * Re-scans the source trees and regenerates only when the file set actually
     * moved, an edit to a file that is already in the database never gets here
     * because the database entry exists and clangd rereads the file itself.
     * @param dir The repository the scan was scheduled for.
     */
    private async _evaluate(dir: string | null) {
        if (!dir) return

        const next = await scanSourceFiles(dir)

        // The project can be closed or switched while the scan is in flight, and
        // its result must not be written over whatever replaced it
        if (this._dir !== dir) return

        const { hasChanged, hasDescriptorChanged } = diffSourceFiles(this._knownFiles, next)

        this._knownFiles = next
        compileDbStore.set({ trackedFileCount: next.size })

        // A failed run leaves the database out of date, and what fixes the usual
        // cause (a header still half-written when it first appeared) is an edit
        // rather than another file appearing, so a failure is worth retrying on any
        // change at all rather than waiting for the set to move again
        if (!hasChanged && !this._hasFailed()) return

        // A build or plugin descriptor can move the solution too, which is left to
        // the user rather than rewritten under an open IDE
        if (hasDescriptorChanged) compileDbStore.set({ isFullRegenSuggested: true })

        await this._run("fast")
    }

    /**
     * Restarts the settle timer, so a `git pull` or a branch switch rewriting
     * hundreds of files ends in one re-scan rather than hundreds.
     */
    private _scheduleEvaluate() {
        const { compileDbDebounceMs } = preferencesStore.get()

        if (this._debounceTimer) clearTimeout(this._debounceTimer)
        this._debounceTimer = setTimeout(() => this._evaluate(this._dir), compileDbDebounceMs)
    }

    /**
     * Runs a regeneration on demand, the entry point behind the menu items and the
     * status chip, and the only way the full regeneration is ever reached.
     * @param kind Which regeneration to perform.
     * @returns The run's outcome, or `null` when it was coalesced or failed to start.
     */
    regenerate(kind: CompileDbRunKind): Promise<CompileDbRunResult | null> {
        return this._run(kind)
    }

    /**
     * Binds the watcher to a repository, takes the baseline scan the later diffs
     * are made against, and attaches the watchers when auto-regeneration is on.
     * The baseline itself never triggers a run.
     * @param dir The absolute repository root path.
     */
    async start(dir: string) {
        if (this._dir === dir) return

        // The mirrors are seeded at construction, which happens before the stored
        // preferences are hydrated, so they are only trustworthy once refreshed
        const { isCompileDbAutoRegenEnabled, unrealEngineRoot } = preferencesStore.get()
        this._isEnabled = isCompileDbAutoRegenEnabled
        this._engineRootOverride = unrealEngineRoot

        this.stop()
        this._dir = dir
        compileDbStore.set({ enabled: this._isEnabled, dir })

        this._knownFiles = await scanSourceFiles(dir)
        compileDbStore.set({ trackedFileCount: this._knownFiles.size })

        // A project with no C++ at all has no compile database to keep up to date,
        // and asking where its engine lives would only produce a pointless error
        if (this._knownFiles.size === 0) return

        try {
            await this._ensureContext()
        } catch (error) {
            compileDbStore.set({ lastError: convertErrorToMessage(error) })
        }

        if (this._isEnabled) this._watchers = await watchSourceTrees(dir, () => this._scheduleEvaluate())
    }

    /**
     * Applies a preference change, attaches or detaches the watchers when
     * auto-regeneration is toggled, and drops the cached context when the app has
     * been pointed at another engine folder.
     */
    async reconfigure() {
        const { isCompileDbAutoRegenEnabled, unrealEngineRoot } = preferencesStore.get()

        if (unrealEngineRoot !== this._engineRootOverride) {
            this._engineRootOverride = unrealEngineRoot
            this._context = null
            compileDbStore.set({ engineRoot: null, target: null, lastError: null })
        }

        if (isCompileDbAutoRegenEnabled === this._isEnabled) return

        this._isEnabled = isCompileDbAutoRegenEnabled
        compileDbStore.set({ enabled: isCompileDbAutoRegenEnabled })

        if (!isCompileDbAutoRegenEnabled) {
            this._closeWatchers()
            return
        }

        if (this._dir && this._watchers.length === 0 && this._knownFiles.size > 0) {
            this._watchers = await watchSourceTrees(this._dir, () => this._scheduleEvaluate())
        }
    }

    /**
     * Unbinds the watcher, called on project close or app quit so it cannot race
     * with a project switch, a run already in flight is left to finish because
     * killing the build tool halfway would leave the database inconsistent.
     */
    stop() {
        this._closeWatchers()

        this._dir = null
        this._context = null
        this._knownFiles = new Map()

        // A run in flight is left alone, but its replay is dropped, it belongs to a
        // project that is no longer open and would otherwise land on the next one
        this._hasPendingRun = false
        this._isPendingRunFull = false

        compileDbStore.set({
            enabled: false,
            dir: null,
            engineRoot: null,
            target: null,
            isFullRegenSuggested: false,
            trackedFileCount: 0,
            lastResult: null,
            lastError: null,
        })
    }
}

/**
 * The single app-wide compile-database service, driven by the renderer through
 * the project lifecycle.
 */
export const compileDbService = new CompileDbService()
