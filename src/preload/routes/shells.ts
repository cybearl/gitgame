import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const shellsApiRoutes: GitgameApi["shells"] = {
    openExternal: url => ipcRenderer.send(CONSTANTS.ipc.shellsOpenExternal, url),
}

export default shellsApiRoutes
