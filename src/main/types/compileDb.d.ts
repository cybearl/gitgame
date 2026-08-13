/**
 * Which regeneration a run performed, `fast` for the clangd compile database on
 * its own and `full` for the solution and the editor workspace alongside it.
 */
export type CompileDbRunKind = "fast" | "full"

/**
 * What a file counts as inside a source tree, `source` for a translation unit or
 * header the compile database indexes, `descriptor` for a build or plugin
 * descriptor whose change can also move the solution.
 */
export type CompileDbFileKind = "source" | "descriptor"

/**
 * Everything a regeneration needs resolved before it can run, gathered once when
 * the watcher binds to a project so a change does not pay for the lookups again.
 */
export type CompileDbContext = {
    projectRoot: string
    uprojectPath: string
    engineRoot: string
    buildScriptPath: string
    target: string
    targetPlatform: string
}

/**
 * The outcome of a single regeneration, `output` is the tail of the combined
 * streams so a failure can be read without opening a terminal, and `failedStep`
 * names which of the steps in a `full` run gave up.
 */
export type CompileDbRunResult = {
    kind: CompileDbRunKind
    ok: boolean
    exitCode: number
    failedStep: string | null
    output: string
    durationMs: number
}

/**
 * The compile-database watcher's observable state, broadcast to every open
 * window so the status chip and the menu items follow the same transitions the
 * watcher records.
 */
export type CompileDbState = {
    enabled: boolean
    dir: string | null
    engineRoot: string | null
    target: string | null
    isRunning: boolean
    runningStep: string | null
    isFullRegenSuggested: boolean
    trackedFileCount: number
    lastRunAt: string | null
    lastResult: CompileDbRunResult | null
    lastError: string | null
}
