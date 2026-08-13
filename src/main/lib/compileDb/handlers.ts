import { compileDbService } from "@main/lib/compileDb/service"
import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { compileDbStore } from "@main/lib/stores/compileDb"
import type { CompileDbRunKind } from "@/main/types/compileDb"

/**
 * Registers the IPC handlers that expose the compile-database watcher to the
 * renderer, covers the manual regeneration and the lifecycle handles the project
 * context drives the watcher with.
 */
export function registerCompileDbHandlers() {
    safeHandle(CONSTANTS.ipc.compileDbGetState, () => compileDbStore.get())
    safeHandle(CONSTANTS.ipc.compileDbRegenerate, (_event, kind: CompileDbRunKind) => compileDbService.regenerate(kind))
    safeHandle(CONSTANTS.ipc.compileDbStart, (_event, dir: string) => compileDbService.start(dir))
    safeHandle(CONSTANTS.ipc.compileDbStop, () => compileDbService.stop())
}
