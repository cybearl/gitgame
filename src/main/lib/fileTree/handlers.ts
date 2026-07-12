import CONSTANTS from "@main/lib/constants"
import { getFileTree } from "@main/lib/fileTree/service"
import { safeHandle } from "@main/lib/ipc"

/**
 * Registers the IPC handler for the repository file tree.
 */
export function registerFileTreeHandlers() {
    safeHandle(CONSTANTS.ipc.fileTreeGet, (_event, dir: string) => getFileTree(dir))
}
