import { compileDbService } from "@main/lib/compileDb/service"
import CONSTANTS from "@main/lib/constants"
import { compileDbStore } from "@main/lib/stores/compileDb"
import { preferencesStore } from "@main/lib/stores/preferences"
import { BrowserWindow } from "electron"
import type { CompileDbState } from "@/main/types/compileDb"

/**
 * Pushes the compile-database state to every open window, so the status chip
 * follows the same transitions the watcher records.
 * @param next The new compile-database state.
 */
function broadcastCompileDbState(next: CompileDbState) {
    BrowserWindow.getAllWindows().forEach(window => {
        if (window.isDestroyed()) return
        window.webContents.send(CONSTANTS.ipc.compileDbStateChanged, next)
    })
}

/**
 * Starts the compile-database subsystem, subscribes the store to the broadcast so
 * every window follows the watcher, the service itself is started by the renderer
 * through the project lifecycle.
 */
export function startCompileDb() {
    compileDbStore.subscribe(broadcastCompileDbState)

    // Reconfiguring attaches watchers, which can fail on a tree that was renamed
    // out from under it, and an unhandled rejection here would take the app down
    preferencesStore.subscribe(() => {
        compileDbService.reconfigure().catch(error => console.error("[compileDb] reconfigure failed:", error))
    })
}

export { compileDbService }
