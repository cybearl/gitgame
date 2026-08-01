import CONSTANTS from "@main/lib/constants"
import { createDialogWindow, openDialog } from "@main/lib/dialogs"
import { initUpdater } from "@main/lib/updater/service"
import { dismissAvailableVersion, isAvailableVersionDismissed, subscribeToUpdaterState } from "@main/lib/updater/store"
import { getMainWindow } from "@main/lib/windows"
import { BrowserWindow } from "electron"
import type { UpdaterState, UpdaterStatus } from "@/main/types/updater"

/**
 * The open update dialog window, tracked so a second check cannot stack another
 * one on top of it.
 */
let updateWindow: BrowserWindow | null = null

/**
 * Pushes the updater state to every open window, so both the dialog and the main
 * window's status bar follow the same transitions.
 * @param next The new updater state.
 */
function broadcastUpdaterState(next: UpdaterState) {
    BrowserWindow.getAllWindows().forEach(window => {
        if (window.isDestroyed()) return
        window.webContents.send(CONSTANTS.ipc.updaterStateChanged, next)
    })
}

/**
 * Opens the update dialog, or focuses the one already open. It is parented to the
 * main window but deliberately not modal, so a download never blocks the app.
 */
export function openUpdateDialog() {
    if (updateWindow && !updateWindow.isDestroyed()) {
        if (updateWindow.isMinimized()) updateWindow.restore()
        updateWindow.focus()

        return
    }

    updateWindow = createDialogWindow(
        getMainWindow(),
        {
            variant: "update",
            title: "Software Update",
        },
        false,
    )

    // Closing the dialog on a merely available update counts as "not now", whichever
    // way it was closed, so the periodic checks stop reopening it for that version
    updateWindow.on("closed", () => {
        updateWindow = null
        dismissAvailableVersion()
    })
}

/**
 * Closes the update dialog, without the close counting as a dismissal, so a result
 * with nothing to act on can be handed over to a smaller dialog instead.
 * @returns `true` when a dialog was actually open, meaning someone is waiting on the result.
 */
function closeUpdateDialog(): boolean {
    if (!updateWindow || updateWindow.isDestroyed()) return false

    updateWindow.close()
    updateWindow = null

    return true
}

/**
 * Hands a result that carries nothing to act on over to a plain dialog, since the
 * update window is sized for release notes and progress that these states do not
 * have, errors go through the error variant so they chime like any other failure.
 * @param next The updater state that ended the flow.
 * @param wasDownloading Whether the state interrupted a download the user started.
 */
function surfaceTerminalResult(next: UpdaterState, wasDownloading: boolean) {
    const wasDialogOpen = closeUpdateDialog()

    // Automatic checks stay silent, only a waiting user gets told
    if (!wasDialogOpen && !wasDownloading) return

    if (next.status === "error") {
        openDialog(getMainWindow(), {
            variant: "error",
            title: "Software Update",
            message: next.error ?? "The update could not be checked.",
        })

        return
    }

    openDialog(getMainWindow(), {
        variant: "message",
        title: "Software Update",
        message: `GitGame is up to date.\n\nYou are running version ${next.currentVersion}, the latest one published.`,
    })
}

/**
 * Starts the updater, mirroring its state onto every window and surfacing the
 * dialog whenever a new version turns up.
 */
export function startUpdater() {
    let previousStatus: UpdaterStatus = "idle"

    subscribeToUpdaterState(next => {
        broadcastUpdaterState(next)

        if (next.status === "available" && !isAvailableVersionDismissed()) openUpdateDialog()

        if (next.status === "not-available" || next.status === "error") {
            surfaceTerminalResult(next, previousStatus === "downloading")
        }

        previousStatus = next.status
    })

    initUpdater()
}
