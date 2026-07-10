import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const projectsApiRoutes: GitgameApi["projects"] = {
    addLocal: () => ipcRenderer.invoke(CONSTANTS.ipc.projectsAddLocal),
    open: dir => ipcRenderer.invoke(CONSTANTS.ipc.projectsOpen, dir),
    getRecent: () => ipcRenderer.invoke(CONSTANTS.ipc.projectsGetRecent),
    removeRecent: dir => ipcRenderer.invoke(CONSTANTS.ipc.projectsRemoveRecent, dir),
    clearRecent: () => ipcRenderer.invoke(CONSTANTS.ipc.projectsClearRecent),
    getPreferences: () => ipcRenderer.invoke(CONSTANTS.ipc.projectsGetPreferences),
    setPreferences: preferences => ipcRenderer.invoke(CONSTANTS.ipc.projectsSetPreferences, preferences),
}

export default projectsApiRoutes
