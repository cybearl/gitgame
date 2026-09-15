import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import { ipcRenderer } from "electron"
import type { AppPreferences } from "@/main/types/store"

const preferencesApiRoutes: GitgameApi["preferences"] = {
    initial: ipcRenderer.sendSync(CONSTANTS.ipc.preferencesGetInitial) as AppPreferences,
    get: () => safeInvoke<AppPreferences>(CONSTANTS.ipc.preferencesGet),
    set: patch => safeInvoke<AppPreferences>(CONSTANTS.ipc.preferencesSet, patch),
    onChange: callback => {
        /**
         * Forwards the committed preferences to the subscriber.
         * @param _ The Electron event, unused.
         * @param next The preferences the main process broadcast.
         */
        const listener = (_: unknown, next: AppPreferences) => {
            callback(next)
        }
        ipcRenderer.on(CONSTANTS.ipc.preferencesChanged, listener)
        return () => ipcRenderer.off(CONSTANTS.ipc.preferencesChanged, listener)
    },
    openWindow: () => ipcRenderer.send(CONSTANTS.ipc.preferencesOpenWindow),
}

export default preferencesApiRoutes
