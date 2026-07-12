import CONSTANTS from "@main/lib/constants"
import {
    getLog,
    getRemoteUrl,
    getRepositoryRoot,
    getStatus,
    isRepository,
    listBranches,
} from "@main/lib/gitCommands/service"
import { safeHandle } from "@main/lib/ipc"

/**
 * Registers the IPC handlers for the read-only Git service.
 */
export function registerGitCommandsHandlers() {
    safeHandle(CONSTANTS.ipc.gitCommandsIsRepository, (_event, dir: string) => isRepository(dir))
    safeHandle(CONSTANTS.ipc.gitCommandsGetRepositoryRoot, (_event, dir: string) => getRepositoryRoot(dir))
    safeHandle(CONSTANTS.ipc.gitCommandsGetStatus, (_event, dir: string) => getStatus(dir))
    safeHandle(CONSTANTS.ipc.gitCommandsListBranches, (_event, dir: string) => listBranches(dir))
    safeHandle(CONSTANTS.ipc.gitCommandsGetLog, (_event, dir: string, limit?: number) => getLog(dir, limit))
    safeHandle(CONSTANTS.ipc.gitCommandsGetRemoteUrl, (_event, dir: string) => getRemoteUrl(dir))
}
