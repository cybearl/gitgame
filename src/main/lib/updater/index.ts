import UPDATER_CONFIG from "@main/config/updater"
import { app } from "electron"
import { autoUpdater } from "electron-updater"

/**
 * Starts the auto-updater against the GitHub Releases feed configured in
 * `electron-builder.yml`.
 */
export function startAutoUpdater() {
    if (!app.isPackaged) return

    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on("error", err => console.error("[updater] error:", err))

    autoUpdater.checkForUpdatesAndNotify()

    setInterval(() => autoUpdater.checkForUpdatesAndNotify(), UPDATER_CONFIG.checkIntervalMs)
}
