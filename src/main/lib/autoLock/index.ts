import { autoLockService } from "@main/lib/autoLock/service"
import CONSTANTS from "@main/lib/constants"
import { autoLockStore } from "@main/lib/stores/autoLock"
import { preferencesStore } from "@main/lib/stores/preferences"
import { BrowserWindow } from "electron"
import type { AutoLockState } from "@/main/types/autoLock"

/**
 * Pushes the auto-lock state to every open window, so the status chip and any
 * manual controls follow the same transitions the loop records.
 * @param next The new auto-lock state.
 */
function broadcastAutoLockState(next: AutoLockState) {
    BrowserWindow.getAllWindows().forEach(window => {
        if (window.isDestroyed()) return
        window.webContents.send(CONSTANTS.ipc.autoLockStateChanged, next)
    })
}

/**
 * Starts the auto-lock subsystem, subscribes the store to the broadcast so
 * every window follows the loop, the service itself is started by the
 * renderer through the project lifecycle.
 */
export function startAutoLock() {
    autoLockStore.subscribe(broadcastAutoLockState)
    preferencesStore.subscribe(() => autoLockService.reconfigure())
}

export { autoLockService }
