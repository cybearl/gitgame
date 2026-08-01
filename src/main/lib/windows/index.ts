import CONSTANTS from "@main/lib/constants"
import type { WindowState } from "@preload/index"
import { BrowserWindow, ipcMain } from "electron"

/**
 * The main application window, tracked so app-global features (such as the
 * updater) can parent their own windows to it.
 */
let mainWindow: BrowserWindow | null = null

/**
 * Registers the main application window and forgets it once it is closed.
 * @param window The main `BrowserWindow` instance.
 */
export function setMainWindow(window: BrowserWindow) {
    mainWindow = window
    window.on("closed", () => {
        if (mainWindow === window) mainWindow = null
    })
}

/**
 * Reads the main application window.
 * @returns The main window, or `null` when it is closed.
 */
export function getMainWindow(): BrowserWindow | null {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

/**
 * Reads the current state of a `BrowserWindow`.
 * @param window The `BrowserWindow` instance to read the state from.
 * @returns A snapshot of the current state of the window.
 */
export function getWindowState(window: BrowserWindow): WindowState {
    return {
        isFocused: window.isFocused(),
        isVisible: window.isVisible(),
        isMinimized: window.isMinimized(),
        isMaximized: window.isMaximized(),
        isFullScreen: window.isFullScreen(),
    }
}

/**
 * Attaches listeners that broadcast the current `WindowState` to the renderer
 * whenever any tracked window state changes.
 * @param window The `BrowserWindow` instance to attach the listeners to.
 */
export function attachWindowStateBroadcaster(window: BrowserWindow) {
    /**
     * Broadcasts the current window state to the renderer process.
     */
    const broadcast = () => {
        if (window.isDestroyed()) return
        window.webContents.send(CONSTANTS.ipc.windowsStateChanged, getWindowState(window))
    }

    // Attach the broadcast function to all relevant window events
    window.on("focus", broadcast)
    window.on("blur", broadcast)
    window.on("show", broadcast)
    window.on("hide", broadcast)
    window.on("minimize", broadcast)
    window.on("restore", broadcast)
    window.on("maximize", broadcast)
    window.on("unmaximize", broadcast)
    window.on("enter-full-screen", broadcast)
    window.on("leave-full-screen", broadcast)
}

/**
 * Registers IPC handlers that allow the renderer-side custom title bar
 * to control its owning `BrowserWindow` (minimize, maximize/restore, close),
 * and to query its current state.
 */
export function registerWindowsControlHandlers() {
    ipcMain.handle(CONSTANTS.ipc.windowsGetState, event => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window) return null
        return getWindowState(window)
    })

    ipcMain.on(CONSTANTS.ipc.windowsMinimize, event => {
        BrowserWindow.fromWebContents(event.sender)?.minimize()
    })

    ipcMain.on(CONSTANTS.ipc.windowsMaximizeToggle, event => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window) return

        if (window.isMaximized()) window.unmaximize()
        else window.maximize()
    })

    ipcMain.on(CONSTANTS.ipc.windowsClose, event => {
        BrowserWindow.fromWebContents(event.sender)?.close()
    })
}
