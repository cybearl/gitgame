import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { openPreferencesWindow } from "@main/lib/preferences"
import { setPreferences } from "@main/lib/preferences/service"
import { configStore } from "@main/lib/stores/config"
import { preferencesStore } from "@main/lib/stores/preferences"
import { ipcMain } from "electron"
import type { AppPreferences } from "@/main/types/store"

/**
 * Registers the IPC handlers that expose the preferences to the renderer,
 * covering the synchronous read every window makes before its first paint, the
 * async read/write pair, and opening the preferences window itself.
 */
export function registerPreferencesHandlers() {
    // Synchronous on purpose: the preload bridge reads this before the renderer
    // paints, so the first frame is already on the right theme
    ipcMain.on(CONSTANTS.ipc.preferencesGetInitial, event => {
        event.returnValue = configStore.getCached().preferences
    })

    safeHandle(CONSTANTS.ipc.preferencesGet, () => preferencesStore.get())
    safeHandle(CONSTANTS.ipc.preferencesSet, (_event, patch: Partial<AppPreferences>) => setPreferences(patch))

    ipcMain.on(CONSTANTS.ipc.preferencesOpenWindow, () => openPreferencesWindow())
}
