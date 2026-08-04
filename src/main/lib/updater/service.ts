import UPDATER_CONFIG from "@main/config/updater"
import CONSTANTS from "@main/lib/constants"
import { normalizeReleaseNotes, parseDownloadProgress } from "@main/lib/updater/parse"
import { updaterSimulator } from "@main/lib/updater/simulator"
import { CLEARED_RELEASE_FIELDS, updaterStore } from "@main/lib/updater/store"
import { convertErrorToMessage } from "@main/lib/utils/errors"
import { app } from "electron"
import { autoUpdater, type ProgressInfo, type UpdateInfo } from "electron-updater"

/**
 * Mirrors the `autoUpdater` lifecycle onto the updater state.
 */
function attachAutoUpdaterEvents() {
    autoUpdater.on("update-available", (info: UpdateInfo) => {
        updaterStore.set({
            status: "available",
            version: info.version,
            releaseNotes: normalizeReleaseNotes(info.releaseNotes),
            releaseDate: info.releaseDate ?? null,
            error: null,
        })
    })

    autoUpdater.on("update-not-available", () => {
        updaterStore.set({
            status: "not-available",
            ...CLEARED_RELEASE_FIELDS,
            error: null,
        })
    })

    autoUpdater.on("download-progress", (info: ProgressInfo) => {
        updaterStore.set({
            status: "downloading",
            progress: parseDownloadProgress(info),
        })
    })

    autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
        updaterStore.set({
            status: "downloaded",
            version: info.version,
            progress: null,
        })
    })

    autoUpdater.on("error", error => {
        console.error("[updater] error:", error)
        updaterStore.set({
            status: "error",
            error: convertErrorToMessage(error),
            progress: null,
        })
    })
}

/**
 * Checks the release feed for a newer version, unless a check or download is
 * already running, in which case the live state is re-emitted so a manual check
 * surfaces the progress that is already there instead of restarting it.
 * @param isManualCheck Whether the user asked for this check.
 */
export async function checkForUpdates(isManualCheck = false) {
    if (updaterSimulator.isActive()) {
        updaterStore.emit()
        return
    }

    if (updaterStore.isBusy()) {
        if (isManualCheck) updaterStore.emit()
        return
    }

    if (!app.isPackaged) {
        updaterStore.set({
            status: "error",
            ...CLEARED_RELEASE_FIELDS,
            error: CONSTANTS.updater.devCheckMessage,
        })

        return
    }

    updaterStore.set({
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
    const state = updaterStore.get()
    if (state.status !== "available" || !state.canAutoInstall) return

    updaterStore.set({
        status: "downloading",
        progress: {
            percent: 0,
            transferred: 0,
            total: 0,
            bytesPerSecond: 0,
        },
    })

    if (updaterSimulator.isActive()) {
        updaterSimulator.runDownload()
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
    if (updaterStore.get().status !== "downloaded") return

    if (updaterSimulator.isActive()) {
        console.log("[updater] simulated install, skipping the real restart")
        return
    }

    setImmediate(() => autoUpdater.quitAndInstall())
}

/**
 * Configures the auto-updater to hand every decision to the user, then schedules
 * the periodic background checks in packaged builds.
 */
export function initUpdater() {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    updaterStore.set({ currentVersion: app.getVersion() })
    attachAutoUpdaterEvents()

    if (!app.isPackaged) return

    setTimeout(() => checkForUpdates(), UPDATER_CONFIG.startupCheckDelayMs)
    setInterval(() => checkForUpdates(), UPDATER_CONFIG.checkIntervalMs)
}
