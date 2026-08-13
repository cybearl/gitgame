import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import { ipcRenderer } from "electron"
import type { CompileDbState } from "@/main/types/compileDb"

const compileDbApiRoutes: GitgameApi["compileDb"] = {
    getState: () => safeInvoke(CONSTANTS.ipc.compileDbGetState),
    onStateChange: callback => {
        const listener = (_: unknown, state: CompileDbState) => callback(state)
        ipcRenderer.on(CONSTANTS.ipc.compileDbStateChanged, listener)
        return () => ipcRenderer.off(CONSTANTS.ipc.compileDbStateChanged, listener)
    },
    regenerate: kind => safeInvoke(CONSTANTS.ipc.compileDbRegenerate, kind),
    start: (dir: string) => safeInvoke(CONSTANTS.ipc.compileDbStart, dir),
    stop: () => safeInvoke(CONSTANTS.ipc.compileDbStop),
}

export default compileDbApiRoutes
