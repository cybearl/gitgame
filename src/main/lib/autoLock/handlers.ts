import { reconcileAutoLock } from "@main/lib/autoLock/reconcile"
import { autoLockService } from "@main/lib/autoLock/service"
import { collectAutoLockTargets } from "@main/lib/autoLock/targets"
import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { getEditorActivity } from "@main/lib/mcp/tools"
import { autoLockStore } from "@main/lib/stores/autoLock"

/**
 * Registers the IPC handlers that expose the auto-lock pipeline to the
 * renderer, covers the dry-run preview, the one-shot reconcile, and the
 * lifecycle handles for the periodic loop.
 */
export function registerAutoLockHandlers() {
    safeHandle(CONSTANTS.ipc.autoLockPreviewTargets, async (_event, dir: string) => {
        const activity = await getEditorActivity()
        const targets = await collectAutoLockTargets(activity, dir)

        return [...targets]
    })

    safeHandle(CONSTANTS.ipc.autoLockReconcile, (_event, dir: string) => reconcileAutoLock(dir))

    safeHandle(CONSTANTS.ipc.autoLockGetState, () => autoLockStore.get())
    safeHandle(CONSTANTS.ipc.autoLockStart, (_event, dir: string) => autoLockService.start(dir))
    safeHandle(CONSTANTS.ipc.autoLockStop, () => autoLockService.stop())
}
