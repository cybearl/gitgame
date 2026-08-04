import UPDATER_CONFIG from "@main/config/updater"
import { buildSimulatedProgress, buildSimulatedState } from "@main/lib/updater/simulation"
import { updaterStore } from "@main/lib/updater/store"
import { app } from "electron"
import type { UpdaterSimulation } from "@/main/types/updater"

/**
 * The fake updater flows driven from the `Dev Tools` menu, self-contained
 * state machine so the real `autoUpdater` path can check `isActive()` and
 * bail without touching a hidden `let` in the service.
 */
export class UpdaterSimulator {
    /**
     * The fake flow currently being driven, `null` when no simulation is on.
     */
    private _scenario: UpdaterSimulation | null = null

    /**
     * The interval stepping a simulated download forward.
     */
    private _timer: NodeJS.Timeout | null = null

    /**
     * Stops any simulated download still stepping forward.
     */
    private _stopTimer() {
        if (!this._timer) return

        clearInterval(this._timer)
        this._timer = null
    }

    /**
     * Whether a simulated flow is currently on, callers use this to skip the
     * real `autoUpdater` path.
     * @returns `true` while a simulation is running.
     */
    isActive(): boolean {
        return this._scenario !== null
    }

    /**
     * Drives a fake updater flow from the `Dev Tools` menu, ignored in
     * packaged builds so it can never interfere with a real update.
     * @param scenario The flow to simulate.
     */
    start(scenario: UpdaterSimulation) {
        if (app.isPackaged) return

        this._stopTimer()
        this._scenario = scenario

        // A fresh simulated version is never treated as already dismissed
        updaterStore.clearDismissedVersion()
        updaterStore.set(buildSimulatedState(scenario, new Date().toISOString()))
    }

    /**
     * Steps a fake download to completion so the progress bar and the restart
     * prompt can be exercised without a real release.
     */
    runDownload() {
        let percent = 0

        this._stopTimer()

        this._timer = setInterval(() => {
            percent = Math.min(100, percent + UPDATER_CONFIG.simulatedDownload.tickPercent)

            if (percent >= 100) {
                this._stopTimer()
                updaterStore.set({
                    status: "downloaded",
                    progress: null,
                })

                return
            }

            updaterStore.set({
                status: "downloading",
                progress: buildSimulatedProgress(percent),
            })
        }, UPDATER_CONFIG.simulatedDownload.tickMs)
    }
}

/**
 * The single app-wide updater simulator, driven by the Dev Tools menu.
 */
export const updaterSimulator = new UpdaterSimulator()
