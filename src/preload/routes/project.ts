import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The API surface for project management operations (folder picker, recent
 * projects, and preferences).
 */
const projectApiRoutes: GitgameApi["project"] = {
    addLocal: () => ipcRenderer.invoke(CONSTANTS.ipc.projectAddLocal),
    open: dir => ipcRenderer.invoke(CONSTANTS.ipc.projectOpen, dir),
    getRecent: () => ipcRenderer.invoke(CONSTANTS.ipc.projectGetRecent),
    removeRecent: dir => ipcRenderer.invoke(CONSTANTS.ipc.projectRemoveRecent, dir),
    clearRecent: () => ipcRenderer.invoke(CONSTANTS.ipc.projectClearRecent),
    getPreferences: () => ipcRenderer.invoke(CONSTANTS.ipc.projectGetPreferences),
    setPreferences: preferences => ipcRenderer.invoke(CONSTANTS.ipc.projectSetPreferences, preferences),
}

export default projectApiRoutes
