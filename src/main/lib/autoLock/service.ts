import { reconcileAutoLock } from "@main/lib/autoLock/reconcile"
import { autoLockStore } from "@main/lib/stores/autoLock"
import { preferencesStore } from "@main/lib/stores/preferences"
import { convertErrorToMessage } from "@main/lib/utils/errors"
import type { AutoLockReconcileResult } from "@/main/types/autoLock"

/**
 * The periodic auto-lock lifecycle owner, drives `reconcileAutoLock` on a
 * timer, updates the store around each tick, and guards against overlapping
 * calls so a slow reconcile cannot stack a second one on top.
 */
export class AutoLockService {
    /**
     * The current tick timer, held so restarting cannot leave a second one
     * running in the background.
     */
    private _timer: NodeJS.Timeout | null = null

    /**
     * Whether a reconcile is currently in flight, guards the periodic timer
     * from stacking a second pass on top of one that has not landed yet.
     */
    private _inFlight = false

    /**
     * The repository directory the loop is bound to, `null` when stopped.
     */
    private _dir: string | null = null

    /**
     * The interval the loop is currently running at, compared on every
     * preference change so an unrelated one does not restart the timer and
     * push the countdown out of step with the last reconcile.
     */
    private _tickIntervalMs = preferencesStore.get().autoLockTickIntervalMs

    /**
     * Runs a single reconcile pass, updates the store with the outcome, and
     * skips silently when no directory is bound or another pass is already in
     * flight.
     * @returns The reconcile result, or `null` when the tick was skipped.
     */
    private async _tick(): Promise<AutoLockReconcileResult | null> {
        if (this._inFlight || !this._dir) return null
        this._inFlight = true
        autoLockStore.set({ isReconciling: true })

        try {
            const result = await reconcileAutoLock(this._dir)
            const failures = [...result.locked, ...result.unlocked].filter(item => !item.ok)

            autoLockStore.set({
                lastReconciledAt: new Date().toISOString(),
                lockedCount: result.targets.length,
                failures,
                lastError: null,
            })

            return result
        } catch (error) {
            autoLockStore.set({
                lastError: convertErrorToMessage(error),
                lastReconciledAt: new Date().toISOString(),
            })

            return null
        } finally {
            this._inFlight = false
            autoLockStore.set({ isReconciling: false })
        }
    }

    /**
     * Restarts the tick timer at the interval the preferences currently carry,
     * kept apart from `start` so a preference change can reschedule the loop
     * without rebinding the directory.
     */
    private _restartTimer() {
        const { autoLockTickIntervalMs } = preferencesStore.get()

        if (this._timer) clearInterval(this._timer)
        this._timer = setInterval(() => this._tick(), autoLockTickIntervalMs)

        autoLockStore.set({ tickIntervalMs: autoLockTickIntervalMs })
    }

    /**
     * Runs a reconcile pass on demand, mostly a hook for a "reconcile now"
     * button and the initial tick after `start`.
     * @returns The reconcile result, or `null` when the tick was skipped.
     */
    reconcile(): Promise<AutoLockReconcileResult | null> {
        return this._tick()
    }

    /**
     * Starts the periodic reconcile loop bound to a repository directory,
     * fires an immediate tick then repeats at the preferred interval, a no-op
     * re-bind when the same directory is already active.
     * @param dir A path inside the repository to reconcile against.
     */
    start(dir: string) {
        if (this._timer && this._dir === dir) return

        this.stop()
        this._dir = dir
        autoLockStore.set({
            enabled: true,
            dir,
            lastError: null,
        })

        this._tick()
        this._restartTimer()
    }

    /**
     * Reschedules the loop when the preferred tick interval has moved, any
     * other preference change leaves the running timer alone.
     */
    reconfigure() {
        const { autoLockTickIntervalMs } = preferencesStore.get()
        if (autoLockTickIntervalMs === this._tickIntervalMs) return

        this._tickIntervalMs = autoLockTickIntervalMs
        if (this._timer) this._restartTimer()
    }

    /**
     * Stops the periodic loop, called on project close or app quit so the
     * loop does not race with a project switch.
     */
    stop() {
        if (this._timer) {
            clearInterval(this._timer)
            this._timer = null
        }

        this._dir = null
        autoLockStore.set({
            enabled: false,
            dir: null,
            isReconciling: false,
        })
    }
}

/**
 * The single app-wide auto-lock service, driven by the renderer through the
 * project lifecycle.
 */
export const autoLockService = new AutoLockService()
