import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import { ipcRenderer } from "electron"
import type { UpdaterState } from "@/main/types/updater"

const updaterApiRoutes: GitgameApi["updater"] = {
    getState: () => safeInvoke(CONSTANTS.ipc.updaterGetState),
    onStateChange: callback => {
        const listener = (_: unknown, state: UpdaterState) => callback(state)
        ipcRenderer.on(CONSTANTS.ipc.updaterStateChanged, listener)
        return () => ipcRenderer.off(CONSTANTS.ipc.updaterStateChanged, listener)
    },
    check: isManualCheck => safeInvoke(CONSTANTS.ipc.updaterCheck, isManualCheck),
    download: () => safeInvoke(CONSTANTS.ipc.updaterDownload),
    install: () => ipcRenderer.send(CONSTANTS.ipc.updaterInstall),
    openDialog: () => ipcRenderer.send(CONSTANTS.ipc.updaterOpenDialog),
    simulate: scenario => ipcRenderer.send(CONSTANTS.ipc.updaterSimulate, scenario),
}

export default updaterApiRoutes
