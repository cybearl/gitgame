import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const appApiRoutes: GitgameApi["app"] = {
    version: ipcRenderer.sendSync(CONSTANTS.ipc.appGetVersion) as string,
}

export default appApiRoutes
