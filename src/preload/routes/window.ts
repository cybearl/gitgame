import CONSTANTS from "@main/lib/constants"
import type { GitgameApi, WindowState } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The API surface for window-related operations.
 */
const windowApiRoutes: GitgameApi["window"] = {
    getState: () => ipcRenderer.invoke(CONSTANTS.ipc.windowGetState),
    onStateChange: callback => {
        const listener = (_: unknown, state: WindowState) => callback(state)

        ipcRenderer.on(CONSTANTS.ipc.windowStateChanged, listener)

        return () => ipcRenderer.off(CONSTANTS.ipc.windowStateChanged, listener)
    },
    minimize: () => ipcRenderer.send(CONSTANTS.ipc.windowMinimize),
    toggleMaximize: () => ipcRenderer.send(CONSTANTS.ipc.windowMaximizeToggle),
    close: () => ipcRenderer.send(CONSTANTS.ipc.windowClose),
}

export default windowApiRoutes
