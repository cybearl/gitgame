import { useTreeContext } from "@renderer/components/contexts/Tree"
import ContextMenu from "@renderer/components/ui/treeView/ContextMenu"
import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TreeView as React95TreeView, ScrollView } from "react95"
import type { FileTreeNode } from "@/main/types/tree"
import {
    collectLockablePaths,
    collectLockedPaths,
    computeLockOwners,
    computeLockStates,
} from "@/renderer/lib/utils/lockStates"
import { buildTree, filterTree, findNodeByPath, reportLockFailures, resolveNode } from "@/renderer/lib/utils/treeView"

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
    const [expanded, setExpanded] = useState<string[]>([])
    const [menu, setMenu] = useState<MenuState | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)

    const { fileTree, locksByPath, lock, unlock } = useTreeContext()

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
     * The filtered file tree along with the ancestor paths of every match,
     * used to auto-expand the tree around results.
     */
    const filtered = useMemo(() => filterTree(fileTree, query ?? ""), [fileTree, query])

    /**
     * The visible file tree mapped to react95 tree leaves.
     */
    const tree = useMemo(
        () => buildTree(filtered.tree, lockStates, lockOwners, locksByPath),
        [filtered.tree, lockStates, lockOwners, locksByPath],
    )

    /**
     * A live mirror of the expanded set so the snapshot effect can read the
     * latest value without depending on `expanded` in its deps array.
     */
    const expandedRef = useRef<string[]>([])

    /**
     * The expanded set captured when the current search began, restored when
     * the search clears so folders return to their pre-search state.
     */
    const preSearchExpandedRef = useRef<string[] | null>(null)

    useEffect(() => {
        expandedRef.current = expanded
    }, [expanded])

    // Snapshot the expanded set when a search begins and restore it when the
    // search is cleared, so auto-expanded folders do not linger
    useEffect(() => {
        const isSearching = Boolean(query?.trim())

        if (isSearching && preSearchExpandedRef.current === null) {
            preSearchExpandedRef.current = expandedRef.current
            return
        }

        if (!isSearching && preSearchExpandedRef.current !== null) {
            setExpanded(preSearchExpandedRef.current)
            preSearchExpandedRef.current = null
        }
    }, [query])

    // Auto-expand every folder that has a match under it whenever the query or
    // the set of matched ancestors changes, without collapsing anything the
    // user had already opened
    useEffect(() => {
        if (!query?.trim()) return
        if (filtered.matchAncestorPaths.length === 0) return

        setExpanded(previous => {
            const merged = new Set(previous)
            for (const path of filtered.matchAncestorPaths) merged.add(path)

            if (merged.size === previous.length) return previous

            return Array.from(merged)
        })
    }, [query, filtered.matchAncestorPaths])

    /**
     * Opens the lock/unlock context menu for the right-clicked node, if it is
     * lockable.
     * @param event The mouse event.
     */
    const handleContextMenu = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current) return

            const visibleNode = resolveNode(event.target as HTMLElement, containerRef.current, filtered.tree)
            if (!visibleNode) return

            const node = findNodeByPath(fileTree, visibleNode.path) ?? visibleNode
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
        [fileTree, filtered.tree, lockStates, locksByPath],
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
        <ScrollView className="tree-scrollview h-full w-full [&>div]:relative [&>div]:z-10">
            <div ref={containerRef} onContextMenu={handleContextMenu}>
                <React95TreeView
                    tree={tree}
                    expanded={expanded}
                    selected={selected}
                    onNodeSelect={(_, id) => onSelect(id)}
                    onNodeToggle={(_, ids) => setExpanded(ids)}
                />
            </div>

            {menu && (
                <ContextMenu
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
        </ScrollView>
    )
}
