import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import { ipcRenderer } from "electron"
import type { AutoLockState } from "@/main/types/autoLock"

const autoLockApiRoutes: GitgameApi["autoLock"] = {
    previewTargets: (dir: string) => safeInvoke(CONSTANTS.ipc.autoLockPreviewTargets, dir),
    reconcile: (dir: string) => safeInvoke(CONSTANTS.ipc.autoLockReconcile, dir),
    getState: () => safeInvoke(CONSTANTS.ipc.autoLockGetState),
    onStateChange: callback => {
        const listener = (_: unknown, state: AutoLockState) => callback(state)
        ipcRenderer.on(CONSTANTS.ipc.autoLockStateChanged, listener)
        return () => ipcRenderer.off(CONSTANTS.ipc.autoLockStateChanged, listener)
    },
    start: (dir: string) => safeInvoke(CONSTANTS.ipc.autoLockStart, dir),
    stop: () => safeInvoke(CONSTANTS.ipc.autoLockStop),
}

export default autoLockApiRoutes
