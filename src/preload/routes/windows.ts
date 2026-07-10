import CONSTANTS from "@main/lib/constants"
import type { GitgameApi, WindowState } from "@preload/index"
import { ipcRenderer } from "electron"

const windowsApiRoutes: GitgameApi["windows"] = {
    getState: () => ipcRenderer.invoke(CONSTANTS.ipc.windowsGetState),
    onStateChange: callback => {
        const listener = (_: unknown, state: WindowState) => callback(state)

        ipcRenderer.on(CONSTANTS.ipc.windowsStateChanged, listener)

        return () => ipcRenderer.off(CONSTANTS.ipc.windowsStateChanged, listener)
    },
    minimize: () => ipcRenderer.send(CONSTANTS.ipc.windowsMinimize),
    toggleMaximize: () => ipcRenderer.send(CONSTANTS.ipc.windowsMaximizeToggle),
    close: () => ipcRenderer.send(CONSTANTS.ipc.windowsClose),
}

export default windowsApiRoutes
