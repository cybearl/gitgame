import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The application version, resolved once at preload load time so the renderer
 * can read it as a plain string without an async IPC round-trip.
 */
const appApiRoutes: GitgameApi["app"] = {
    version: ipcRenderer.sendSync(CONSTANTS.ipc.appGetVersion) as string,
}

export default appApiRoutes
