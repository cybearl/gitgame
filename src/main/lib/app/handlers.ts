import CONSTANTS from "@main/lib/constants"
import { app, ipcMain } from "electron"

/**
 * Whether a renderer has yet to load since the app started, cleared by the first one to ask
 * so that a reload or an HMR refresh no longer passes for a launch.
 */
let isFirstLoadPending = true

/**
 * Registers the synchronous IPC handlers returning the application version, baked in at
 * build time by electron-builder or read from `package.json` in dev, and whether the
 * calling renderer is the first one to load since the app started.
 */
export function registerAppHandlers() {
    ipcMain.on(CONSTANTS.ipc.appGetVersion, event => {
        event.returnValue = app.getVersion()
    })

    ipcMain.on(CONSTANTS.ipc.appConsumeFirstLoad, event => {
        event.returnValue = isFirstLoadPending
        isFirstLoadPending = false
    })
}
