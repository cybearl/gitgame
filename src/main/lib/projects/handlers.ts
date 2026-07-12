import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import {
    addLocalProject,
    clearRecentProjects,
    getPreferences,
    getRecentProjects,
    openProject,
    removeRecentProject,
    setPreferences,
} from "@main/lib/projects/service"
import { BrowserWindow } from "electron"
import type { AppPreferences } from "@/main/types/store"

/**
 * Registers the IPC handlers for the project service (folder picker, recent
 * projects, and preferences).
 */
export function registerProjectsHandlers() {
    safeHandle(CONSTANTS.ipc.projectsAddLocal, event => addLocalProject(BrowserWindow.fromWebContents(event.sender)))
    safeHandle(CONSTANTS.ipc.projectsOpen, (_event, dir: string) => openProject(dir))
    safeHandle(CONSTANTS.ipc.projectsGetRecent, () => getRecentProjects())
    safeHandle(CONSTANTS.ipc.projectsRemoveRecent, (_event, dir: string) => removeRecentProject(dir))
    safeHandle(CONSTANTS.ipc.projectsClearRecent, () => clearRecentProjects())
    safeHandle(CONSTANTS.ipc.projectsGetPreferences, () => getPreferences())
    safeHandle(CONSTANTS.ipc.projectsSetPreferences, (_event, preferences: Partial<AppPreferences>) =>
        setPreferences(preferences),
    )
}
