import CONSTANTS from "@main/lib/constants"
import {
    addLocalProject,
    clearRecentProjects,
    getPreferences,
    getRecentProjects,
    openProject,
    removeRecentProject,
    setPreferences,
} from "@main/lib/projects/service"
import { BrowserWindow, ipcMain } from "electron"
import type { AppPreferences } from "@/main/types/store"

/**
 * Registers the IPC handlers that expose the project service (folder picker,
 * recent projects, and preferences) to the renderer process.
 */
export function registerProjectsHandlers() {
    ipcMain.handle(CONSTANTS.ipc.projectsAddLocal, event =>
        addLocalProject(BrowserWindow.fromWebContents(event.sender)),
    )
    ipcMain.handle(CONSTANTS.ipc.projectsOpen, (_event, dir: string) => openProject(dir))
    ipcMain.handle(CONSTANTS.ipc.projectsGetRecent, () => getRecentProjects())
    ipcMain.handle(CONSTANTS.ipc.projectsRemoveRecent, (_event, dir: string) => removeRecentProject(dir))
    ipcMain.handle(CONSTANTS.ipc.projectsClearRecent, () => clearRecentProjects())
    ipcMain.handle(CONSTANTS.ipc.projectsGetPreferences, () => getPreferences())
    ipcMain.handle(CONSTANTS.ipc.projectsSetPreferences, (_event, preferences: Partial<AppPreferences>) =>
        setPreferences(preferences),
    )
}
