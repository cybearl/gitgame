import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { openUProject } from "@main/lib/uproject/service"

/**
 * Registers the IPC handler that opens a project's `.uproject` file in Unreal Engine.
 */
export function registerUProjectHandlers() {
    safeHandle(CONSTANTS.ipc.uprojectOpen, (_event, dir: string) => openUProject(dir))
}
