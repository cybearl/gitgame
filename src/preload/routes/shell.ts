import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The API surface for shell operations (opening external resources).
 */
const shellApiRoutes: GitgameApi["shell"] = {
    openExternal: url => ipcRenderer.send(CONSTANTS.ipc.shellOpenExternal, url),
}

export default shellApiRoutes
