import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The API surface for reading the repository file tree.
 */
const treeApiRoutes: GitgameApi["tree"] = {
    getFileTree: dir => ipcRenderer.invoke(CONSTANTS.ipc.treeGetFileTree, dir),
}

export default treeApiRoutes
