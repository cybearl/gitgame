import path from "node:path"
import CONSTANTS from "@main/lib/constants"
import { attachWindowStateBroadcaster } from "@main/lib/windows"
import { BrowserWindow, ipcMain } from "electron"
import DIALOGS_CONFIG from "@/main/config/dialogs"
import WINDOWS_CONFIG from "@/main/config/windows"
import type { ConfirmDialogOptions, DialogOptions } from "@/main/types/dialogs"

/**
 * A dialog window awaiting the user's response.
 */
type PendingDialog = {
    options: DialogOptions
    resolve: (result: boolean) => void
}

/**
 * The open dialog windows, keyed by their `BrowserWindow` id.
 */
const pendingDialogs = new Map<number, PendingDialog>()

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
 * Opens a frameless, Win95-styled modal dialog window and resolves once the user
 * responds or closes it (a close counts as a cancel).
 * @param parent The window that owns the dialog, or `null` to show it detached.
 * @param options The dialog contents and variant.
 * @returns `true` when confirmed, `false` when cancelled or closed.
 */
export function openDialog(parent: BrowserWindow | null, options: DialogOptions): Promise<boolean> {
    return new Promise(resolve => {
        const size = DIALOGS_CONFIG.sizes[options.variant]

        const window = new BrowserWindow({
            ...WINDOWS_CONFIG.dialog,
            parent: parent ?? undefined,
            modal: parent !== null,
            width: size.width,
            height: size.height,
        })

        pendingDialogs.set(window.id, { options, resolve })

        // Broadcast focus and visibility changes so the dialog's title bar can
        // reflect the active state consistently with the main window
        attachWindowStateBroadcaster(window)

        window.once("ready-to-show", () => window.show())

        // A window closed without an explicit response resolves as a cancel
        window.on("closed", () => {
            const pending = pendingDialogs.get(window.id)
            if (pending) {
                pendingDialogs.delete(window.id)
                pending.resolve(false)
            }
        })

        loadDialog(window)
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

    ipcMain.on(CONSTANTS.ipc.dialogsError, (event, title: string, message: string, detail?: string) => {
        openDialog(BrowserWindow.fromWebContents(event.sender), { variant: "error", title, message, detail })
    })

    ipcMain.handle(CONSTANTS.ipc.dialogsGetOptions, event => {
        const window = BrowserWindow.fromWebContents(event.sender)
        return window ? (pendingDialogs.get(window.id)?.options ?? null) : null
    })

    ipcMain.on(CONSTANTS.ipc.dialogsRespond, (event, result: boolean) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window) return

        const pending = pendingDialogs.get(window.id)
        if (pending) {
            pendingDialogs.delete(window.id)
            pending.resolve(result)
        }

        window.close()
    })
}
