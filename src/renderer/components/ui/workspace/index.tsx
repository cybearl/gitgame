import { useTreeContext } from "@renderer/components/contexts/Tree"
import DetailsPane from "@renderer/components/ui/workspace/DetailsPane"
import FilesPane from "@renderer/components/ui/workspace/FilesPane"
import useResizablePaneWidth from "@renderer/hooks/useResizablePaneWidth"
import { useCallback, useEffect, useMemo, useState } from "react"
import WORKSPACE_CONFIG from "@/renderer/config/workspace"
import { findNodeByPath } from "@/renderer/lib/utils/treeView"

export default function Workspace() {
    const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined)

    const { fileTree } = useTreeContext()

    /**
     * Persists the final files pane width to the app preferences, fired when a
     * resize drag ends.
     * @param finalWidth The width to persist, in pixels.
     */
    const persistWidth = useCallback((finalWidth: number) => {
        window.api.project.setPreferences({ filesPaneWidth: finalWidth })
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

        window.api.project.getPreferences().then(preferences => {
            if (cancelled) return
            setWidth(preferences.filesPaneWidth)
        })

        return () => {
            cancelled = true
        }
    }, [setWidth])

    /**
     * The file tree node currently selected in the files pane, resolved from
     * the tracked path so it stays in sync with tree refreshes.
     */
    const selectedNode = useMemo(
        () => (selectedPath ? findNodeByPath(fileTree, selectedPath) : undefined),
        [fileTree, selectedPath],
    )

    /**
     * The inline style applied to the files pane so its width tracks the
     * resize hook.
     */
    const filesPaneStyle = useMemo(() => ({ width }), [width])

    return (
        <div className="relative h-full w-full">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <img
                    src="./assets/images/cthulhu.png"
                    alt=""
                    className="w-[8%] opacity-15 [image-rendering:pixelated] select-none"
                />
            </div>

            <div className="relative flex h-full w-full">
                <FilesPane
                    selected={selectedPath}
                    onSelect={setSelectedPath}
                    className="shrink-0"
                    style={filesPaneStyle}
                />

                <div onMouseDown={handleDragStart} className="group relative w-1 shrink-0 cursor-col-resize">
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/20 group-hover:bg-black/40 group-active:bg-black/60" />
                </div>

                <DetailsPane selectedNode={selectedNode} className="min-w-0 flex-1" />
            </div>
        </div>
    )
}
