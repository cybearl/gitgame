import useResizablePaneWidth from "@renderer/hooks/useResizablePaneWidth"
import useWindowWidth from "@renderer/hooks/useWindowWidth"
import { useCallback, useEffect, useMemo } from "react"
import DetailsPane from "@/renderer/components/panes/details"
import FilesPane from "@/renderer/components/panes/Files"
import WORKSPACE_CONFIG from "@/renderer/config/workspace"

export default function Workspace() {
    const windowWidth = useWindowWidth()

    /**
     * The widest the files pane may go, kept under a share of the window so the
     * splitter stays within reach however small the window gets.
     */
    const maxWidth = useMemo(
        () => Math.min(WORKSPACE_CONFIG.filesPaneMaxWidth, windowWidth * WORKSPACE_CONFIG.filesPaneMaxWidthRatio),
        [windowWidth],
    )

    /**
     * Persists the final files pane width to the app preferences, fired when a
     * resize drag ends.
     * @param finalWidth The width to persist, in pixels.
     */
    const persistWidth = useCallback((finalWidth: number) => {
        window.api.projects.setPreferences({ filesPaneWidth: finalWidth })
    }, [])

    const { width, setWidth, handleDragStart } = useResizablePaneWidth({
        initialWidth: WORKSPACE_CONFIG.filesPaneDefaultWidth,
        minWidth: WORKSPACE_CONFIG.filesPaneMinWidth,
        maxWidth,
        onCommit: persistWidth,
    })

    /**
     * The inline style applied to the files pane so its width tracks the
     * resize hook.
     */
    const filesPaneStyle = useMemo(() => ({ width }), [width])

    // Load the persisted files pane width once on mount, clamped by the hook
    useEffect(() => {
        let cancelled = false

        window.api.projects.getPreferences().then(preferences => {
            if (cancelled) return
            setWidth(preferences.filesPaneWidth)
        })

        return () => {
            cancelled = true
        }
    }, [setWidth])

    return (
        <div className="relative h-full w-full">
            <div className="relative flex h-full w-full">
                <FilesPane className="shrink-0" style={filesPaneStyle} />

                <div onMouseDown={handleDragStart} className="group relative w-1 shrink-0 cursor-col-resize">
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/20 group-hover:bg-black/40 group-active:bg-black/60" />
                </div>

                <DetailsPane className="min-w-0 flex-1" />
            </div>
        </div>
    )
}
