import CONSTANTS from "@main/lib/constants"
import { configStore } from "@main/lib/stores/config"
import { type BrowserWindow, type Rectangle, screen } from "electron"
import type { WindowBounds, WindowPlacement } from "@/main/types/store"

/**
 * Checks that remembered bounds carry four real numbers.
 * @param bounds The bounds read from the store.
 * @returns Whether they can be used as-is.
 */
function isUsableBounds(bounds: WindowBounds | null): bounds is WindowBounds {
    if (!bounds) return false
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return false

    return bounds.width > 0 && bounds.height > 0
}

/**
 * Checks whether a window placed at the given bounds would still be within
 * reach on the given work area.
 * @param bounds The bounds to check.
 * @param workArea The work area of the display they would land on.
 * @returns Whether the window would be reachable.
 */
function isReachable(bounds: WindowBounds, workArea: Rectangle): boolean {
    const overlapsHorizontally =
        bounds.x + bounds.width > workArea.x + CONSTANTS.windows.minimumVisiblePx &&
        bounds.x < workArea.x + workArea.width - CONSTANTS.windows.minimumVisiblePx

    const keepsTitleBarInReach =
        bounds.y >= workArea.y && bounds.y < workArea.y + workArea.height - CONSTANTS.windows.minimumVisiblePx

    return overlapsHorizontally && keepsTitleBarInReach
}

/**
 * Fits remembered bounds onto the screens attached right now.
 * @param bounds The remembered bounds.
 * @returns The bounds to actually restore.
 */
function fitBoundsToScreen(bounds: WindowBounds): WindowBounds {
    const { workArea } = screen.getDisplayMatching(bounds)

    const width = Math.min(bounds.width, workArea.width)
    const height = Math.min(bounds.height, workArea.height)

    if (isReachable(bounds, workArea)) {
        return {
            x: bounds.x,
            y: bounds.y,
            width,
            height,
        }
    }

    return {
        x: Math.round(workArea.x + (workArea.width - width) / 2),
        y: Math.round(workArea.y + (workArea.height - height) / 2),
        width,
        height,
    }
}

/**
 * Reads the placement worth remembering for a window.
 * @param window The window to read.
 * @returns Its current placement.
 */
function readPlacement(window: BrowserWindow): WindowPlacement {
    const { x, y, width, height } = window.getNormalBounds()

    return {
        bounds: {
            x,
            y,
            width,
            height,
        },
        isMaximized: window.isMaximized(),
        isFullScreen: window.isFullScreen(),
    }
}

/**
 * Puts a window back to the size, position and state the last session left it
 * in.
 * @param window The window to restore.
 */
export async function restoreWindowPlacement(window: BrowserWindow): Promise<void> {
    const { windowPlacement } = await configStore.get()

    if (isUsableBounds(windowPlacement.bounds)) {
        window.setBounds(fitBoundsToScreen(windowPlacement.bounds))
    }

    if (windowPlacement.isFullScreen) window.setFullScreen(true)
    else if (windowPlacement.isMaximized) window.maximize()
}

/**
 * Keeps the store in step with a window's size, position and state, so the next
 * launch can pick up where this one left off.
 * @param window The window to follow.
 */
export function attachWindowPlacementPersistence(window: BrowserWindow) {
    let handle: NodeJS.Timeout | null = null

    /**
     * Writes the window's placement to the store, a minimized window is left
     * out, the platforms disagree on what it reports for its own state.
     */
    const save = () => {
        if (window.isDestroyed() || window.isMinimized()) return

        configStore.update(config => {
            config.windowPlacement = readPlacement(window)
            return config
        })
    }

    /**
     * Holds the write back until the move or the resize has settled.
     */
    const scheduleSave = () => {
        if (handle) clearTimeout(handle)
        handle = setTimeout(save, CONSTANTS.windows.placementSaveDebounceMs)
    }

    // Attach listeners to save the window placement on changes
    window.on("resize", scheduleSave)
    window.on("move", scheduleSave)
    window.on("maximize", scheduleSave)
    window.on("unmaximize", scheduleSave)
    window.on("enter-full-screen", scheduleSave)
    window.on("leave-full-screen", scheduleSave)

    // Take a last reading on the way out, a window closed right after being moved would
    // otherwise take its pending write down with it
    window.on("close", () => {
        if (handle) clearTimeout(handle)
        save()
    })
}
