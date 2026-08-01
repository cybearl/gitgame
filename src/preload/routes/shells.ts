import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import { ipcRenderer } from "electron"

const shellsApiRoutes: GitgameApi["shells"] = {
    openExternal: url => ipcRenderer.send(CONSTANTS.ipc.shellsOpenExternal, url),
    showFolder: dir => safeInvoke<void>(CONSTANTS.ipc.shellsShowFolder, dir),
    openTerminal: dir => safeInvoke<void>(CONSTANTS.ipc.shellsOpenTerminal, dir),
}

export default shellsApiRoutes
