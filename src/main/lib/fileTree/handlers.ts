import CONSTANTS from "@main/lib/constants"
import { getFileTree } from "@main/lib/fileTree/service"
import { ipcMain } from "electron"

/**
 * Registers the IPC handler that exposes the repository file tree to the
 * renderer process.
 */
export function registerFileTreeHandlers() {
    ipcMain.handle(CONSTANTS.ipc.fileTreeGet, (_event, dir: string) => getFileTree(dir))
}
