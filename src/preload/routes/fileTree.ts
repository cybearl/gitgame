import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const fileTreeApiRoutes: GitgameApi["fileTree"] = {
    get: dir => ipcRenderer.invoke(CONSTANTS.ipc.fileTreeGet, dir),
}

export default fileTreeApiRoutes
