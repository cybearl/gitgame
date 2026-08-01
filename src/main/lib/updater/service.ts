import UPDATER_CONFIG from "@main/config/updater"
import CONSTANTS from "@main/lib/constants"
import { normalizeReleaseNotes, parseDownloadProgress } from "@main/lib/updater/parse"
import { buildSimulatedProgress, buildSimulatedState } from "@main/lib/updater/simulation"
import {
    CLEARED_RELEASE_FIELDS,
    clearDismissedVersion,
    emitUpdaterState,
    getUpdaterState,
    isUpdaterBusy,
    setUpdaterState,
} from "@main/lib/updater/store"
import { convertErrorToMessage } from "@main/lib/utils/errors"
import { app } from "electron"
import { autoUpdater, type ProgressInfo, type UpdateInfo } from "electron-updater"
import type { UpdaterSimulation } from "@/main/types/updater"

/**
 * The fake flow currently being driven from the `Dev Tools` menu, if any. While
 * set, the real `autoUpdater` is never called.
 */
let simulation: UpdaterSimulation | null = null

/**
 * The interval stepping a simulated download forward.
 */
let simulationTimer: NodeJS.Timeout | null = null

/**
 * Stops any simulated download still stepping forward.
 */
function stopSimulationTimer() {
    if (!simulationTimer) return

    clearInterval(simulationTimer)
    simulationTimer = null
}

/**
 * Steps a fake download to completion so the progress bar and the restart prompt
 * can be exercised without a real release.
 */
function runSimulatedDownload() {
    let percent = 0

    stopSimulationTimer()

    simulationTimer = setInterval(() => {
        percent = Math.min(100, percent + UPDATER_CONFIG.simulatedDownload.tickPercent)

        if (percent >= 100) {
            stopSimulationTimer()
            setUpdaterState({ status: "downloaded", progress: null })

            return
        }

        setUpdaterState({ status: "downloading", progress: buildSimulatedProgress(percent) })
    }, UPDATER_CONFIG.simulatedDownload.tickMs)
}

/**
 * Mirrors the `autoUpdater` lifecycle onto the updater state.
 */
function attachAutoUpdaterEvents() {
    autoUpdater.on("update-available", (info: UpdateInfo) => {
        setUpdaterState({
            status: "available",
            version: info.version,
            releaseNotes: normalizeReleaseNotes(info.releaseNotes),
            releaseDate: info.releaseDate ?? null,
            error: null,
        })
    })

    autoUpdater.on("update-not-available", () => {
        setUpdaterState({ status: "not-available", ...CLEARED_RELEASE_FIELDS, error: null })
    })

    autoUpdater.on("download-progress", (info: ProgressInfo) => {
        setUpdaterState({ status: "downloading", progress: parseDownloadProgress(info) })
    })

    autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
        setUpdaterState({ status: "downloaded", version: info.version, progress: null })
    })

    autoUpdater.on("error", error => {
        console.error("[updater] error:", error)
        setUpdaterState({ status: "error", error: convertErrorToMessage(error), progress: null })
    })
}

/**
 * Checks the release feed for a newer version, unless a check or download is
 * already running, in which case the live state is re-emitted so a manual check
 * surfaces the progress that is already there instead of restarting it.
 * @param isManualCheck Whether the user asked for this check.
 */
export async function checkForUpdates(isManualCheck = false) {
    if (simulation) {
        emitUpdaterState()
        return
    }

    if (isUpdaterBusy()) {
        if (isManualCheck) emitUpdaterState()
        return
    }

    if (!app.isPackaged) {
        setUpdaterState({
            status: "error",
            ...CLEARED_RELEASE_FIELDS,
            error: CONSTANTS.updater.devCheckMessage,
        })

        return
    }

    setUpdaterState({
        status: "checking",
        ...CLEARED_RELEASE_FIELDS,
        error: null,
        progress: null,
    })

    try {
        await autoUpdater.checkForUpdates()
    } catch {
        // Swallowed on purpose: electron-updater emits `error` before rethrowing, so
        // the listener has already recorded it and reacting here would broadcast twice
    }
}

/**
 * Downloads the pending installer, only from the `available` state so a second
 * call while a download is running is a no-op.
 */
export async function downloadUpdate() {
    const state = getUpdaterState()
    if (state.status !== "available" || !state.canAutoInstall) return

    setUpdaterState({
        status: "downloading",
        progress: {
            percent: 0,
            transferred: 0,
            total: 0,
            bytesPerSecond: 0,
        },
    })

    if (simulation) {
        runSimulatedDownload()
        return
    }

    try {
        await autoUpdater.downloadUpdate()
    } catch {
        // Swallowed for the same reason as in `checkForUpdates`, the `error` listener owns it
    }
}

/**
 * Quits and installs the staged update, deferred by a tick so the IPC call that
 * triggered it can unwind before the app goes away.
 */
export function installUpdate() {
    if (getUpdaterState().status !== "downloaded") return

    if (simulation) {
        console.log("[updater] simulated install, skipping the real restart")
        return
    }

    setImmediate(() => autoUpdater.quitAndInstall())
}

/**
 * Drives a fake updater flow from the `Dev Tools` menu, ignored in packaged
 * builds so it can never interfere with a real update.
 * @param scenario The flow to simulate.
 */
export function simulateUpdate(scenario: UpdaterSimulation) {
    if (app.isPackaged) return

    stopSimulationTimer()
    simulation = scenario

    // A fresh simulated version is never treated as already dismissed
    clearDismissedVersion()

    setUpdaterState(buildSimulatedState(scenario, new Date().toISOString()))
}

/**
 * Configures the auto-updater to hand every decision to the user, then schedules
 * the periodic background checks in packaged builds.
 */
export function initUpdater() {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    setUpdaterState({ currentVersion: app.getVersion() })
    attachAutoUpdaterEvents()

    if (!app.isPackaged) return

    setTimeout(() => checkForUpdates(), UPDATER_CONFIG.startupCheckDelayMs)
    setInterval(() => checkForUpdates(), UPDATER_CONFIG.checkIntervalMs)
}
