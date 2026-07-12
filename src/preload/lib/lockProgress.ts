import { randomUUID } from "node:crypto"
import CONSTANTS from "@main/lib/constants"
import { ipcRenderer } from "electron"
import type { LfsLockProgress } from "@/main/types/lfsCommands"

/**
 * Runs a lock/unlock invocation while forwarding per-file progress to the
 * caller's `onProgress` callback, scoped to a fresh request id.
 * @param onProgress The renderer-side progress callback, or `undefined`.
 * @param invoke Thunk that runs the underlying `safeInvoke` call.
 * @returns The value resolved by `invoke`.
 */
export async function withLockProgress<T>(
    onProgress: ((done: number, total: number) => void) | undefined,
    invoke: (requestId: string | null) => Promise<T>,
): Promise<T> {
    if (!onProgress) return invoke(null)

    const requestId = randomUUID()
    const listener = (_: unknown, payload: LfsLockProgress) => {
        if (payload.requestId === requestId) onProgress(payload.done, payload.total)
    }

    ipcRenderer.on(CONSTANTS.ipc.lfsCommandsLockProgress, listener)

    try {
        return await invoke(requestId)
    } finally {
        ipcRenderer.off(CONSTANTS.ipc.lfsCommandsLockProgress, listener)
    }
}
