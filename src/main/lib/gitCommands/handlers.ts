import CONSTANTS from "@main/lib/constants"
import {
    getLog,
    getRemoteUrl,
    getRepositoryRoot,
    getStatus,
    isRepository,
    listBranches,
} from "@main/lib/gitCommands/service"
import { ipcMain } from "electron"

/**
 * Registers the IPC handlers that expose the read-only Git service to the
 * renderer process.
 */
export function registerGitCommandsHandlers() {
    ipcMain.handle(CONSTANTS.ipc.gitCommandsIsRepository, (_event, dir: string) => isRepository(dir))
    ipcMain.handle(CONSTANTS.ipc.gitCommandsGetRepositoryRoot, (_event, dir: string) => getRepositoryRoot(dir))
    ipcMain.handle(CONSTANTS.ipc.gitCommandsGetStatus, (_event, dir: string) => getStatus(dir))
    ipcMain.handle(CONSTANTS.ipc.gitCommandsListBranches, (_event, dir: string) => listBranches(dir))
    ipcMain.handle(CONSTANTS.ipc.gitCommandsGetLog, (_event, dir: string, limit?: number) => getLog(dir, limit))
    ipcMain.handle(CONSTANTS.ipc.gitCommandsGetRemoteUrl, (_event, dir: string) => getRemoteUrl(dir))
}
