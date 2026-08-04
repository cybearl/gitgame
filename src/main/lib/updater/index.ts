import CONSTANTS from "@main/lib/constants"
import { createDialogWindow, openDialog } from "@main/lib/dialogs"
import { initUpdater } from "@main/lib/updater/service"
import { updaterStore } from "@main/lib/updater/store"
import { getMainWindow } from "@main/lib/windows"
import { BrowserWindow } from "electron"
import type { UpdaterState, UpdaterStatus } from "@/main/types/updater"

/**
 * Owns the update dialog window and the transitions that need cross-tick
 * context (was-downloading, was-open), so the two used to live as a
 * module-scoped `let` and a closure variable that could drift apart.
 */
class UpdateDialogController {
    /**
     * The open dialog window, `null` when no dialog is on screen.
     */
    private _window: BrowserWindow | null = null

    /**
     * The previously observed status, needed by the terminal surface so a
     * `not-available`/`error` landing after `downloading` still gets told to
     * the user even when they never opened the dialog.
     */
    private _previousStatus: UpdaterStatus = "idle"

    /**
     * Closes the dialog programmatically, without the close counting as a
     * dismissal, so a result with nothing to act on can be handed over to a
     * smaller dialog instead.
     * @returns `true` when a dialog was actually open.
     */
    private _close(): boolean {
        if (!this._window || this._window.isDestroyed()) return false

        this._window.close()
        this._window = null

        return true
    }

    /**
     * Hands a result that carries nothing to act on over to a plain dialog,
     * the update window is sized for release notes and progress these states
     * do not have, errors go through the error variant so they chime like any
     * other failure.
     * @param next The updater state that ended the flow.
     * @param wasDownloading Whether the state interrupted a download the user started.
     */
    private _surfaceTerminalResult(next: UpdaterState, wasDownloading: boolean) {
        const wasDialogOpen = this._close()

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
     * Opens the update dialog, or focuses the one already open, parented to
     * the main window but deliberately not modal so a download never blocks
     * the app.
     */
    open() {
        if (this._window && !this._window.isDestroyed()) {
            if (this._window.isMinimized()) this._window.restore()
            this._window.focus()

            return
        }

        this._window = createDialogWindow(
            getMainWindow(),
            {
                variant: "update",
                title: "Software Update",
            },
            false,
        )

        // Closing the dialog on a merely available update counts as "not now",
        // whichever way it was closed, so the periodic checks stop reopening
        // it for that version
        this._window.on("closed", () => {
            this._window = null
            updaterStore.dismissAvailableVersion()
        })
    }

    /**
     * Handles a store transition, opens the dialog on a fresh available
     * version and surfaces terminal results when a flow ends.
     * @param next The new updater state.
     */
    onStateChange(next: UpdaterState) {
        if (next.status === "available" && !updaterStore.isAvailableVersionDismissed()) this.open()

        if (next.status === "not-available" || next.status === "error") {
            this._surfaceTerminalResult(next, this._previousStatus === "downloading")
        }

        this._previousStatus = next.status
    }
}

/**
 * The single app-wide update dialog controller.
 */
const updateDialogController = new UpdateDialogController()

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
 * Opens the update dialog, or focuses the one already open.
 */
export function openUpdateDialog() {
    updateDialogController.open()
}

/**
 * Starts the updater, mirroring its state onto every window and surfacing the
 * dialog whenever a new version turns up.
 */
export function startUpdater() {
    updaterStore.subscribe(next => {
        broadcastUpdaterState(next)
        updateDialogController.onStateChange(next)
    })

    initUpdater()
}
