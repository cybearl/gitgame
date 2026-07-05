import CONSTANTS from "@main/lib/constants"
import { getLog, getRepositoryRoot, getStatus, isRepository, listBranches } from "@main/lib/git/service"
import { ipcMain } from "electron"

/**
 * Registers the IPC handlers that expose the read-only Git service to the
 * renderer process.
 */
export function registerGitHandlers() {
    ipcMain.handle(CONSTANTS.ipc.gitIsRepository, (_event, dir: string) => isRepository(dir))
    ipcMain.handle(CONSTANTS.ipc.gitGetRepositoryRoot, (_event, dir: string) => getRepositoryRoot(dir))
    ipcMain.handle(CONSTANTS.ipc.gitGetStatus, (_event, dir: string) => getStatus(dir))
    ipcMain.handle(CONSTANTS.ipc.gitListBranches, (_event, dir: string) => listBranches(dir))
    ipcMain.handle(CONSTANTS.ipc.gitGetLog, (_event, dir: string, limit?: number) => getLog(dir, limit))
}
