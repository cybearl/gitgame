import useResizablePaneWidth from "@renderer/hooks/useResizablePaneWidth"
import { useCallback, useEffect, useMemo } from "react"
import DetailsPane from "@/renderer/components/panes/Details"
import FilesPane from "@/renderer/components/panes/Files"
import WORKSPACE_CONFIG from "@/renderer/config/workspace"

export default function Workspace() {
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
        maxWidth: WORKSPACE_CONFIG.filesPaneMaxWidth,
        onCommit: persistWidth,
    })

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

    /**
     * The inline style applied to the files pane so its width tracks the
     * resize hook.
     */
    const filesPaneStyle = useMemo(() => ({ width }), [width])

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
