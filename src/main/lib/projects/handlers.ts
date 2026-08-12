import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import {
    addLocalProject,
    clearRecentProjects,
    getRecentProjects,
    openProject,
    removeRecentProject,
} from "@main/lib/projects/service"
import { BrowserWindow } from "electron"

/**
 * Registers the IPC handlers for the project service (folder picker and recent
 * projects).
 */
export function registerProjectsHandlers() {
    safeHandle(CONSTANTS.ipc.projectsAddLocal, event => addLocalProject(BrowserWindow.fromWebContents(event.sender)))
    safeHandle(CONSTANTS.ipc.projectsOpen, (_event, dir: string) => openProject(dir))
    safeHandle(CONSTANTS.ipc.projectsGetRecent, () => getRecentProjects())
    safeHandle(CONSTANTS.ipc.projectsRemoveRecent, (_event, dir: string) => removeRecentProject(dir))
    safeHandle(CONSTANTS.ipc.projectsClearRecent, () => clearRecentProjects())
}
