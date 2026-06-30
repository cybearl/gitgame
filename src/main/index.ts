import path from "node:path"
import WINDOW_CONFIG from "@main/config/window"
import { attachWindowStateBroadcaster, registerWindowControlHandlers } from "@main/lib/utils/window"
import { app, BrowserWindow, shell } from "electron"

/**
 * Creates the application's main `BrowserWindow` and loads either the Vite dev server URL
 * (in development) or the bundled renderer HTML file (in production).
 * @returns The created BrowserWindow instance.
 */
function createMainWindow(): BrowserWindow {
    const window = new BrowserWindow(WINDOW_CONFIG)

    // Show the window when it's ready
    window.on("ready-to-show", () => window.show())

    // Broadcast focus/visibility/maximize/fullscreen state changes to the renderer
    attachWindowStateBroadcaster(window)

    // Open external links in the user's default browser
    window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: "deny" }
    })

    // Load the appropriate URL or file into the window
    if (process.env.ELECTRON_RENDERER_URL) {
        window.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
        window.loadFile(path.join(__dirname, "..", "renderer", "index.html"))
    }

    return window
}

// Create the main application window when Electron is ready
app.whenReady().then(() => {
    registerWindowControlHandlers()
    createMainWindow()

    // Re-create a window in the app when the dock icon is clicked (macOS)
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
})

// Quit the application when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})
