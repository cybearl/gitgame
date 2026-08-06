/**
 * The bounds a pane's width is held within.
 */
export type PaneWidthBounds = {
    minWidth: number
    maxWidth: number
}

/**
 * Holds a requested pane width within the given bounds.
 * @param width The requested width, in pixels.
 * @param bounds The bounds to hold it within.
 * @returns The clamped width.
 */
export function clampPaneWidth(width: number, bounds: PaneWidthBounds): number {
    return Math.max(bounds.minWidth, Math.min(bounds.maxWidth, width))
}
