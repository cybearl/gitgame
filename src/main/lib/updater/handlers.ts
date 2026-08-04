import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { openUpdateDialog } from "@main/lib/updater"
import { checkForUpdates, downloadUpdate, installUpdate } from "@main/lib/updater/service"
import { updaterSimulator } from "@main/lib/updater/simulator"
import { updaterStore } from "@main/lib/updater/store"
import { ipcMain } from "electron"
import type { UpdaterSimulation } from "@/main/types/updater"

/**
 * Registers the IPC handlers that expose the updater to the renderer, letting the
 * dialog read the current state, start a check or a download, open the dialog from
 * the status bar, and trigger the restart that installs the staged version.
 */
export function registerUpdaterHandlers() {
    safeHandle(CONSTANTS.ipc.updaterGetState, () => updaterStore.get())

    ipcMain.on(CONSTANTS.ipc.updaterOpenDialog, () => openUpdateDialog())

    safeHandle(CONSTANTS.ipc.updaterCheck, async (_event, isManualCheck: boolean) => {
        // A manual check shows the dialog up front, so the user sees the check run
        // and gets told when there is nothing to install
        if (isManualCheck) openUpdateDialog()

        await checkForUpdates(isManualCheck)
    })

    safeHandle(CONSTANTS.ipc.updaterDownload, () => downloadUpdate())

    ipcMain.on(CONSTANTS.ipc.updaterInstall, () => installUpdate())

    ipcMain.on(CONSTANTS.ipc.updaterSimulate, (_event, scenario: UpdaterSimulation) => {
        openUpdateDialog()
        updaterSimulator.start(scenario)
    })
}
