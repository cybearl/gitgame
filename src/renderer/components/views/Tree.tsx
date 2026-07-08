import { useTreeContext } from "@renderer/components/contexts/Tree"
import { type MouseEvent, useCallback, useMemo, useRef, useState } from "react"
import { TreeView as React95TreeView, ScrollView } from "react95"
import type { FileTreeNode } from "@/main/types/tree"
import FlatResultsList from "@/renderer/components/lists/FlatResults"
import TreeViewContextMenu from "@/renderer/components/menus/TreeViewContext"
import {
    collectLockablePaths,
    collectLockedPaths,
    computeLockOwners,
    computeLockStates,
} from "@/renderer/lib/utils/lockStates"
import {
    buildTree,
    collectMatchingFiles,
    findNodeByPath,
    reportLockFailures,
    resolveNode,
} from "@/renderer/lib/utils/treeView"

/**
 * The state of the open context menu, anchored to a right-clicked node.
 */
type MenuState = {
    x: number
    y: number
    node: FileTreeNode
    canLock: boolean
    lockablePaths: string[]
    minePaths: string[]
    othersPaths: string[]
}

type TreeViewProps = {
    selected: string | undefined
    onSelect: (id: string) => void
    query?: string
}

export default function TreeView({ selected, onSelect, query }: TreeViewProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    const [expanded, setExpanded] = useState<string[]>([])
    const [menu, setMenu] = useState<MenuState | null>(null)

    const { fileTree, locksByPath, lock, unlock } = useTreeContext()

    const isSearching = Boolean(query?.trim())

    /**
     * The computed lock states for the file tree, always derived from the full
     * tree so folder aggregates stay accurate regardless of any active search.
     */
    const lockStates = useMemo(() => computeLockStates(fileTree, locksByPath), [fileTree, locksByPath])

    /**
     * The locked-file counts by owner for every node in the full file tree.
     */
    const lockOwners = useMemo(() => computeLockOwners(fileTree, locksByPath), [fileTree, locksByPath])

    /**
     * The flat list of files matching the search query, or an empty list when
     * the user is not searching.
     */
    const matches = useMemo(
        () => (isSearching ? collectMatchingFiles(fileTree, query ?? "") : []),
        [isSearching, fileTree, query],
    )

    /**
     * The full file tree mapped to react95 tree leaves, only built when not
     * searching so the flat-results path skips the tree work entirely.
     */
    const tree = useMemo(
        () => (isSearching ? [] : buildTree(fileTree, lockStates, lockOwners, locksByPath)),
        [isSearching, fileTree, lockStates, lockOwners, locksByPath],
    )

    /**
     * Opens the lock/unlock context menu for the given node, if it is lockable.
     * @param event The mouse event.
     * @param node The node the menu should target.
     */
    const openMenuForNode = useCallback(
        (event: MouseEvent<HTMLElement>, node: FileTreeNode) => {
            if (!node.isLockable) return

            event.preventDefault()
            setMenu({
                x: event.clientX,
                y: event.clientY,
                node,
                canLock: (lockStates.get(node.path) ?? "unlockable") !== "locked",
                lockablePaths: collectLockablePaths(node),
                minePaths: collectLockedPaths(node, locksByPath, true),
                othersPaths: collectLockedPaths(node, locksByPath, false),
            })
        },
        [lockStates, locksByPath],
    )

    /**
     * Resolves the right-clicked tree item back to a file tree node and opens
     * the lock/unlock context menu for it.
     * @param event The mouse event.
     */
    const handleTreeContextMenu = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current) return

            const visibleNode = resolveNode(event.target as HTMLElement, containerRef.current, fileTree)
            if (!visibleNode) return

            const node = findNodeByPath(fileTree, visibleNode.path) ?? visibleNode
            openMenuForNode(event, node)
        },
        [fileTree, openMenuForNode],
    )

    /**
     * Dismisses the context menu.
     */
    const dismissMenu = useCallback(() => setMenu(null), [])

    /**
     * Locks every lockable file covered by the menu's node.
     */
    const handleLock = useCallback(async () => {
        if (!menu) return

        dismissMenu()
        reportLockFailures(await lock(menu.lockablePaths))
    }, [menu, lock, dismissMenu])

    /**
     * Unlocks the current user's own locks covered by the menu's node.
     */
    const handleUnlock = useCallback(async () => {
        if (!menu) return

        dismissMenu()
        reportLockFailures(await unlock(menu.minePaths, false))
    }, [menu, unlock, dismissMenu])

    /**
     * Force-unlocks other users' locks covered by the menu's node, after native confirmation.
     */
    const handleForceUnlock = useCallback(async () => {
        if (!menu) return

        const { othersPaths } = menu
        dismissMenu()

        const confirmed = await window.api.dialog.confirm({
            title: "Force unlock",
            message: `Force unlock ${othersPaths.length} file${othersPaths.length === 1 ? "" : "s"} locked by other users?`,
            detail: "Forcing may discard work the lock owner has not pushed yet.",
            confirmLabel: "Force unlock",
            isDestructive: true,
        })

        if (!confirmed) return

        reportLockFailures(await unlock(othersPaths, true))
    }, [menu, unlock, dismissMenu])

    return (
        <>
            {isSearching ? (
                <FlatResultsList
                    matches={matches}
                    selected={selected}
                    onSelect={onSelect}
                    onContextMenu={openMenuForNode}
                    lockStates={lockStates}
                    lockOwners={lockOwners}
                    locksByPath={locksByPath}
                />
            ) : (
                <ScrollView className="tree-scrollview h-full w-full [&>div]:relative [&>div]:z-10">
                    <div ref={containerRef} onContextMenu={handleTreeContextMenu}>
                        <React95TreeView
                            tree={tree}
                            expanded={expanded}
                            selected={selected}
                            onNodeSelect={(_, id) => onSelect(id)}
                            onNodeToggle={(_, ids) => setExpanded(ids)}
                        />
                    </div>
                </ScrollView>
            )}

            {menu && (
                <TreeViewContextMenu
                    x={menu.x}
                    y={menu.y}
                    canLock={menu.canLock}
                    mineCount={menu.minePaths.length}
                    othersCount={menu.othersPaths.length}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                    onForceUnlock={handleForceUnlock}
                    onDismiss={dismissMenu}
                />
            )}
        </>
    )
}
