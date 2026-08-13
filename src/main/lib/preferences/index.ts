import WINDOWS_CONFIG from "@main/config/windows"
import CONSTANTS from "@main/lib/constants"
import { loadPreferences } from "@main/lib/preferences/service"
import { preferencesStore } from "@main/lib/stores/preferences"
import { attachWindowStateBroadcaster, getMainWindow, loadRendererRoute } from "@main/lib/windows"
import { BrowserWindow } from "electron"
import type { AppPreferences } from "@/main/types/store"

/**
 * Owns the preferences window, so the menu item can open it without ever
 * putting a second copy on screen.
 */
class PreferencesWindowController {
    /**
     * The open preferences window, `null` when none is on screen.
     */
    private _window: BrowserWindow | null = null

    /**
     * Opens the preferences window, or focuses the one already open, parented
     * to the main window but deliberately not modal so the user can keep
     * working while comparing themes.
     */
    open() {
        if (this._window && !this._window.isDestroyed()) {
            if (this._window.isMinimized()) this._window.restore()
            this._window.focus()

            return
        }

        this._window = new BrowserWindow({
            ...WINDOWS_CONFIG.preferences,
            parent: getMainWindow() ?? undefined,
        })

        // Broadcast focus and visibility changes so the window's title bar can
        // reflect the active state consistently with the main window
        attachWindowStateBroadcaster(this._window)

        this._window.once("ready-to-show", () => this._window?.show())
        this._window.on("closed", () => {
            this._window = null
        })

        loadRendererRoute(this._window, "/preferences")
    }
}

/**
 * The single app-wide preferences window controller.
 */
const preferencesWindowController = new PreferencesWindowController()

/**
 * Pushes the preferences to every open window, so a change made in the
 * preferences window reaches the main window as it is made.
 * @param next The new preferences.
 */
function broadcastPreferences(next: AppPreferences) {
    BrowserWindow.getAllWindows().forEach(window => {
        if (window.isDestroyed()) return
        window.webContents.send(CONSTANTS.ipc.preferencesChanged, next)
    })
}

/**
 * Opens the preferences window, or focuses the one already open.
 */
export function openPreferencesWindow() {
    preferencesWindowController.open()
}

/**
 * Starts the preferences subsystem, hydrates the store from disk then mirrors
 * every later change onto every window, awaited before the first window is
 * created so the renderer never paints on the wrong theme.
 */
export async function startPreferences() {
    await loadPreferences()
    preferencesStore.subscribe(broadcastPreferences)
}
