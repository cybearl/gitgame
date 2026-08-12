import path from "node:path"
import WINDOWS_CONFIG from "@main/config/windows"
import { registerAppHandlers } from "@main/lib/app/handlers"
import { startAutoLock } from "@main/lib/autoLock"
import { registerAutoLockHandlers } from "@main/lib/autoLock/handlers"
import { registerDialogsHandlers } from "@main/lib/dialogs"
import { registerFileTreeHandlers } from "@main/lib/fileTree/handlers"
import { registerGitCommandsHandlers } from "@main/lib/gitCommands/handlers"
import { registerLfsCommandsHandlers } from "@main/lib/lfsCommands/handlers"
import { startMcp } from "@main/lib/mcp"
import { registerMcpHandlers } from "@main/lib/mcp/handlers"
import { startPreferences } from "@main/lib/preferences"
import { registerPreferencesHandlers } from "@main/lib/preferences/handlers"
import { registerProjectsHandlers } from "@main/lib/projects/handlers"
import { registerShellsHandlers } from "@main/lib/shells/handlers"
import { startUpdater } from "@main/lib/updater"
import { registerUpdaterHandlers } from "@main/lib/updater/handlers"
import { registerUProjectHandlers } from "@main/lib/uproject/handlers"
import { registerViewStateHandlers } from "@main/lib/viewState/handlers"
import { attachWindowStateBroadcaster, registerWindowsControlHandlers, setMainWindow } from "@main/lib/windows"
import { attachWindowPlacementPersistence, restoreWindowPlacement } from "@main/lib/windows/placement"
import { app, BrowserWindow, shell } from "electron"

/**
 * Creates the application's main `BrowserWindow` and loads either the Vite dev server URL
 * (in development) or the bundled renderer HTML file (in production).
 * @returns The created BrowserWindow instance.
 */
async function createMainWindow(): Promise<BrowserWindow> {
    const window = new BrowserWindow(WINDOWS_CONFIG.main)

    // Put the window back where the last session left it, nothing can show it before
    // the renderer is loaded below, so the move is never on screen
    await restoreWindowPlacement(window)
    attachWindowPlacementPersistence(window)

    // Show the window when it's ready
    window.on("ready-to-show", () => window.show())

    // Broadcast focus/visibility/maximize/fullscreen state changes to the renderer
    attachWindowStateBroadcaster(window)

    // Track it as the main window, so app-global features can parent to it
    setMainWindow(window)

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
app.whenReady().then(async () => {
    // Handlers
    registerAppHandlers()
    registerWindowsControlHandlers()
    registerDialogsHandlers()
    registerGitCommandsHandlers()
    registerLfsCommandsHandlers()
    registerFileTreeHandlers()
    registerProjectsHandlers()
    registerUProjectHandlers()
    registerShellsHandlers()
    registerUpdaterHandlers()
    registerMcpHandlers()
    registerAutoLockHandlers()
    registerViewStateHandlers()
    registerPreferencesHandlers()

    // Hydrate the preferences before anything paints, the renderer reads the theme
    // synchronously at preload and would otherwise flash the default one
    await startPreferences()

    // Create the main window
    await createMainWindow()

    // Start services
    startUpdater()
    startMcp()
    startAutoLock()

    // Re-create a window in the app when the dock icon is clicked (macOS)
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
})

// Quit the application when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})
