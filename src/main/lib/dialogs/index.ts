import path from "node:path"
import CONSTANTS from "@main/lib/constants"
import { attachWindowStateBroadcaster } from "@main/lib/windows"
import { BrowserWindow, ipcMain } from "electron"
import DIALOGS_CONFIG from "@/main/config/dialogs"
import WINDOWS_CONFIG from "@/main/config/windows"
import type { ConfirmDialogOptions, DialogOptions } from "@/main/types/dialogs"

/**
 * A single dialog's registry entry, pairs its options with an optional promise
 * resolver so the two used to live in separate maps that could drift, kept
 * together here to make that structurally impossible.
 */
type DialogEntry = {
    options: DialogOptions
    resolve?: (result: boolean) => void
}

/**
 * The registry of open dialog windows, keyed by their `BrowserWindow` id, one
 * entry per window carrying its options and the resolver of any awaiter.
 */
class DialogRegistry {
    /**
     * The entries keyed by `BrowserWindow.id`, options and any pending
     * resolver travel together here.
     */
    private _entries = new Map<number, DialogEntry>()

    /**
     * Records a new dialog window and the resolver of any awaiter, called
     * once when the window is created.
     * @param id The window id.
     * @param options The dialog contents and variant.
     * @param resolve The promise resolver, if the caller is awaiting a response.
     */
    register(id: number, options: DialogOptions, resolve?: (result: boolean) => void) {
        this._entries.set(id, { options, resolve })
    }

    /**
     * Reads the options of an open dialog window.
     * @param id The window id.
     * @returns The options, or `null` when no dialog is registered under that id.
     */
    getOptions(id: number): DialogOptions | null {
        return this._entries.get(id)?.options ?? null
    }

    /**
     * Resolves the awaiter of a dialog window with the given result and drops
     * the entry, an already-resolved or unknown id is a no-op.
     * @param id The window id.
     * @param result The response to hand to the awaiter.
     */
    respond(id: number, result: boolean) {
        const entry = this._entries.get(id)
        if (!entry) return

        this._entries.delete(id)
        entry.resolve?.(result)
    }

    /**
     * Drops the entry for a closed window, cancelling any still-pending
     * awaiter, called from the window's `closed` handler.
     * @param id The window id.
     */
    forget(id: number) {
        this.respond(id, false)
    }
}

/**
 * The single app-wide dialog registry.
 */
const dialogRegistry = new DialogRegistry()

/**
 * Loads the renderer's dialog route into the given window, in development or production.
 * @param window The dialog window to load.
 */
function loadDialog(window: BrowserWindow) {
    if (process.env.ELECTRON_RENDERER_URL) {
        window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/dialog`)
    } else {
        window.loadFile(path.join(__dirname, "..", "renderer", "index.html"), { hash: "/dialog" })
    }
}

/**
 * Creates a frameless, Win95-styled dialog window sized for its variant and loads
 * the renderer's dialog route into it.
 * @param parent The window that owns the dialog, or `null` to show it detached.
 * @param options The dialog contents and variant.
 * @param isModal Whether the dialog blocks its parent, defaults to blocking whenever it has one.
 * @param resolve The promise resolver, if the caller is awaiting a response.
 * @returns The created dialog window.
 */
function createDialog(
    parent: BrowserWindow | null,
    options: DialogOptions,
    isModal: boolean,
    resolve?: (result: boolean) => void,
): BrowserWindow {
    const size = DIALOGS_CONFIG.sizes[options.variant]

    const window = new BrowserWindow({
        ...WINDOWS_CONFIG.dialog,
        parent: parent ?? undefined,
        modal: isModal,
        width: size.width,
        height: size.height,
    })

    dialogRegistry.register(window.id, options, resolve)

    // Broadcast focus and visibility changes so the dialog's title bar can
    // reflect the active state consistently with the main window
    attachWindowStateBroadcaster(window)

    window.once("ready-to-show", () => window.show())

    // A window closed without an explicit response resolves as a cancel
    window.on("closed", () => dialogRegistry.forget(window.id))

    loadDialog(window)

    return window
}

/**
 * Creates a dialog window without awaiting its response, used by callers that
 * manage the window lifecycle themselves (e.g the updater dialog).
 * @param parent The window that owns the dialog, or `null` to show it detached.
 * @param options The dialog contents and variant.
 * @param isModal Whether the dialog blocks its parent, defaults to blocking whenever it has one.
 * @returns The created dialog window.
 */
export function createDialogWindow(
    parent: BrowserWindow | null,
    options: DialogOptions,
    isModal = parent !== null,
): BrowserWindow {
    return createDialog(parent, options, isModal)
}

/**
 * Opens a modal dialog window and resolves once the user responds or closes it
 * (a close counts as a cancel).
 * @param parent The window that owns the dialog, or `null` to show it detached.
 * @param options The dialog contents and variant.
 * @returns `true` when confirmed, `false` when cancelled or closed.
 */
export function openDialog(parent: BrowserWindow | null, options: DialogOptions): Promise<boolean> {
    return new Promise(resolve => {
        createDialog(parent, options, parent !== null, resolve)
    })
}

/**
 * Registers the IPC handlers that open Win95-styled dialog windows and relay
 * their options and responses between the main and renderer processes.
 */
export function registerDialogsHandlers() {
    ipcMain.handle(CONSTANTS.ipc.dialogsConfirm, (event, options: ConfirmDialogOptions) =>
        openDialog(BrowserWindow.fromWebContents(event.sender), { ...options, variant: "confirm" }),
    )

    ipcMain.on(CONSTANTS.ipc.dialogsMessage, (event, title: string, message: string) => {
        openDialog(BrowserWindow.fromWebContents(event.sender), { variant: "message", title, message })
    })

    ipcMain.on(CONSTANTS.ipc.dialogsError, (event, title: string, message: string) => {
        openDialog(BrowserWindow.fromWebContents(event.sender), { variant: "error", title, message })
    })

    ipcMain.on(CONSTANTS.ipc.dialogsErrorWithDetails, (event, title: string, message: string, details: string) => {
        openDialog(BrowserWindow.fromWebContents(event.sender), {
            variant: "error-with-details",
            title,
            message,
            details,
        })
    })

    ipcMain.handle(CONSTANTS.ipc.dialogsGetOptions, event => {
        const window = BrowserWindow.fromWebContents(event.sender)
        return window ? dialogRegistry.getOptions(window.id) : null
    })

    ipcMain.on(CONSTANTS.ipc.dialogsRespond, (event, result: boolean) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window) return

        dialogRegistry.respond(window.id, result)
        window.close()
    })
}
