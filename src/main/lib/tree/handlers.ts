import CONSTANTS from "@main/lib/constants"
import { getFileTree } from "@main/lib/tree/service"
import { ipcMain } from "electron"

/**
 * Registers the IPC handler that exposes the repository file tree to the
 * renderer process.
 */
export function registerTreeHandlers() {
    ipcMain.handle(CONSTANTS.ipc.treeGetFileTree, (_event, dir: string) => getFileTree(dir))
}
