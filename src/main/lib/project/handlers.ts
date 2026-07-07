import CONSTANTS from "@main/lib/constants"
import {
    addLocalProject,
    clearRecentProjects,
    getPreferences,
    getRecentProjects,
    openProject,
    removeRecentProject,
    setPreferences,
} from "@main/lib/project/service"
import { BrowserWindow, ipcMain } from "electron"
import type { AppPreferences } from "@/main/types/store"

/**
 * Registers the IPC handlers that expose the project service (folder picker,
 * recent projects, and preferences) to the renderer process.
 */
export function registerProjectHandlers() {
    ipcMain.handle(CONSTANTS.ipc.projectAddLocal, event => addLocalProject(BrowserWindow.fromWebContents(event.sender)))
    ipcMain.handle(CONSTANTS.ipc.projectOpen, (_event, dir: string) => openProject(dir))
    ipcMain.handle(CONSTANTS.ipc.projectGetRecent, () => getRecentProjects())
    ipcMain.handle(CONSTANTS.ipc.projectRemoveRecent, (_event, dir: string) => removeRecentProject(dir))
    ipcMain.handle(CONSTANTS.ipc.projectClearRecent, () => clearRecentProjects())
    ipcMain.handle(CONSTANTS.ipc.projectGetPreferences, () => getPreferences())
    ipcMain.handle(CONSTANTS.ipc.projectSetPreferences, (_event, preferences: Partial<AppPreferences>) =>
        setPreferences(preferences),
    )
}
