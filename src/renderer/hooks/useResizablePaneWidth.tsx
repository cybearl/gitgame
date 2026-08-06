import { clampPaneWidth, type PaneWidthBounds } from "@renderer/lib/utils/panes"
import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react"

/**
 * The options for the `useResizablePaneWidth` hook.
 */
type UseResizablePaneWidthOptions = PaneWidthBounds & {
    initialWidth: number
    onCommit?: (width: number) => void
}

/**
 * The value returned by the `useResizablePaneWidth` hook.
 */
type UseResizablePaneWidthResult = {
    width: number
    setWidth: (next: number) => void
    handleDragStart: (event: ReactMouseEvent) => void
}

/**
 * Manages a resizable pane's width driven by mouse drag on a splitter element.
 * @param options The initial width, clamp bounds, and commit callback.
 * @returns The current width, a clamping setter, and the drag-start handler.
 */
export default function useResizablePaneWidth({
    initialWidth,
    minWidth,
    maxWidth,
    onCommit,
}: UseResizablePaneWidthOptions): UseResizablePaneWidthResult {
    const [width, setInternalWidth] = useState<number>(initialWidth)

    /**
     * A ref mirroring the latest width so drag handlers always read the current
     * value without going stale.
     */
    const widthRef = useRef(initialWidth)

    useEffect(() => {
        widthRef.current = width
    }, [width])

    /**
     * A ref mirroring the bounds so the setter and the drag handler keep a stable
     * identity, the maximum follows the window width and would otherwise rebuild
     * them, and every effect keyed on them, on each resize.
     */
    const boundsRef = useRef<PaneWidthBounds>({ minWidth, maxWidth })

    useEffect(() => {
        boundsRef.current = { minWidth, maxWidth }
    }, [minWidth, maxWidth])

    /**
     * A ref to the commit callback so its identity does not force the drag
     * handler to be recreated on every render.
     */
    const onCommitRef = useRef(onCommit)

    useEffect(() => {
        onCommitRef.current = onCommit
    }, [onCommit])

    // Pull the pane back in when the bounds tighten, shrinking the window lowers the
    // maximum and would otherwise leave the pane, and its splitter, off screen
    useEffect(() => {
        setInternalWidth(previous => clampPaneWidth(previous, { minWidth, maxWidth }))
    }, [minWidth, maxWidth])

    /**
     * Sets the pane width, clamping the given value into the configured range.
     * @param next The requested width, in pixels.
     */
    const setWidth = useCallback((next: number) => {
        setInternalWidth(clampPaneWidth(next, boundsRef.current))
    }, [])

    /**
     * Starts a resize drag from the splitter, wiring document-level move and up
     * listeners for the drag's duration and persisting the final width on end.
     * @param event The pointer-down event on the splitter.
     */
    const handleDragStart = useCallback((event: ReactMouseEvent) => {
        event.preventDefault()

        const { clientX: startX } = event
        const { current: startWidth } = widthRef
        const { cursor: previousBodyCursor, userSelect: previousBodyUserSelect } = document.body.style

        document.body.style.cursor = "col-resize"
        document.body.style.userSelect = "none"

        /**
         * Updates the pane width as the pointer moves during the drag.
         * @param moveEvent The pointer-move event.
         */
        const handleMove = (moveEvent: MouseEvent) => {
            setInternalWidth(clampPaneWidth(startWidth + (moveEvent.clientX - startX), boundsRef.current))
        }

        /**
         * Ends the drag, removing the document listeners, restoring the
         * body cursor, and firing the commit callback with the final width.
         */
        const handleUp = () => {
            document.removeEventListener("mousemove", handleMove)
            document.removeEventListener("mouseup", handleUp)

            document.body.style.cursor = previousBodyCursor
            document.body.style.userSelect = previousBodyUserSelect

            onCommitRef.current?.(widthRef.current)
        }

        document.addEventListener("mousemove", handleMove)
        document.addEventListener("mouseup", handleUp)
    }, [])

    return { width, setWidth, handleDragStart }
}
