import CONSTANTS from "@main/lib/constants"
import { app, ipcMain } from "electron"

/**
 * Registers the IPC handler that returns the application version baked in at
 * build time by electron-builder (via `extraMetadata.version`), or the value
 * from `package.json` when running in development.
 *
 * Note: uses a synchronous channel so the preload script can resolve the
 * version once at load time and expose it as a plain string, avoiding an
 * async round-trip on every read from the renderer.
 */
export function registerAppHandlers() {
    ipcMain.on(CONSTANTS.ipc.appGetVersion, event => {
        event.returnValue = app.getVersion()
    })
}
