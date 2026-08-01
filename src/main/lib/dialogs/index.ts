import path from "node:path"
import CONSTANTS from "@main/lib/constants"
import { attachWindowStateBroadcaster } from "@main/lib/windows"
import { BrowserWindow, ipcMain } from "electron"
import DIALOGS_CONFIG from "@/main/config/dialogs"
import WINDOWS_CONFIG from "@/main/config/windows"
import type { ConfirmDialogOptions, DialogOptions } from "@/main/types/dialogs"

/**
 * The options of every open dialog window, keyed by their `BrowserWindow` ID.
 */
const dialogOptions = new Map<number, DialogOptions>()

/**
 * The resolvers of the dialog windows awaiting a boolean response, keyed by their
 * `BrowserWindow` ID.
 */
const pendingDialogs = new Map<number, (result: boolean) => void>()

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
 * @returns The created dialog window.
 */
export function createDialogWindow(
    parent: BrowserWindow | null,
    options: DialogOptions,
    isModal = parent !== null,
): BrowserWindow {
    const size = DIALOGS_CONFIG.sizes[options.variant]

    const window = new BrowserWindow({
        ...WINDOWS_CONFIG.dialog,
        parent: parent ?? undefined,
        modal: isModal,
        width: size.width,
        height: size.height,
    })

    dialogOptions.set(window.id, options)

    // Broadcast focus and visibility changes so the dialog's title bar can
    // reflect the active state consistently with the main window
    attachWindowStateBroadcaster(window)

    window.once("ready-to-show", () => window.show())

    // A window closed without an explicit response resolves as a cancel
    window.on("closed", () => {
        dialogOptions.delete(window.id)

        const resolve = pendingDialogs.get(window.id)
        if (resolve) {
            pendingDialogs.delete(window.id)
            resolve(false)
        }
    })

    loadDialog(window)

    return window
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
        const window = createDialogWindow(parent, options)
        pendingDialogs.set(window.id, resolve)
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
        return window ? (dialogOptions.get(window.id) ?? null) : null
    })

    ipcMain.on(CONSTANTS.ipc.dialogsRespond, (event, result: boolean) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window) return

        const resolve = pendingDialogs.get(window.id)
        if (resolve) {
            pendingDialogs.delete(window.id)
            resolve(result)
        }

        window.close()
    })
}
