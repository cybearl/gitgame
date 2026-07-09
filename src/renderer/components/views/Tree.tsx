import { useTreeContext } from "@renderer/components/contexts/Tree"
import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import { type MouseEvent, useCallback, useEffect, useMemo, useRef } from "react"
import { TreeView as React95TreeView, ScrollView } from "react95"
import FlatResultsList from "@/renderer/components/lists/FlatResults"
import TreeViewContextMenu from "@/renderer/components/menus/TreeViewContext"
import { buildTree, findNodeByPath, resolveNode } from "@/renderer/lib/utils/treeView"

export default function TreeView() {
    const containerRef = useRef<HTMLDivElement>(null)

    const { fileTree, locksByPath } = useTreeContext()
    const {
        expandedPaths,
        selectedPath,
        visibleTree,
        matches,
        menu,
        lockStates,
        lockOwners,
        setExpandedPaths,
        select,
        openMenu,
    } = useTreeViewContext()

    /**
     * The visible file tree mapped to react95 tree leaves, only built when not
     * searching so the flat-results path skips the tree work entirely.
     */
    const tree = useMemo(
        () => (matches === null ? buildTree(visibleTree, lockStates, lockOwners, locksByPath) : []),
        [matches, visibleTree, lockStates, lockOwners, locksByPath],
    )

    /**
     * Resolves the right-clicked tree item back to a file tree node and opens
     * the lock/unlock context menu for it.
     * @param event The mouse event.
     */
    const handleTreeContextMenu = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current) return

            const visibleNode = resolveNode(event.target as HTMLElement, containerRef.current, visibleTree)
            if (!visibleNode) return

            const node = findNodeByPath(fileTree, visibleNode.path) ?? visibleNode
            openMenu(event, node)
        },
        [fileTree, visibleTree, openMenu],
    )

    // Bring the currently selected item into view when the tree view is active,
    // so a reveal action (or programmatic selection) scrolls the row on screen
    useEffect(() => {
        if (matches !== null) return
        if (!selectedPath) return
        if (!containerRef.current) return

        const item = containerRef.current.querySelector<HTMLElement>('li[aria-selected="true"]')
        item?.scrollIntoView({ block: "nearest", behavior: "auto" })
    }, [matches, selectedPath])

    return (
        <>
            <ScrollView className="tree-scrollview h-full w-full [&>div]:relative [&>div]:z-10">
                {matches === null ? (
                    <div ref={containerRef} onContextMenu={handleTreeContextMenu}>
                        <React95TreeView
                            tree={tree}
                            expanded={expandedPaths}
                            selected={selectedPath}
                            onNodeSelect={(_, id) => select(id)}
                            onNodeToggle={(_, ids) => setExpandedPaths(ids)}
                        />
                    </div>
                ) : (
                    <FlatResultsList />
                )}
            </ScrollView>

            {menu && <TreeViewContextMenu />}
        </>
    )
}
