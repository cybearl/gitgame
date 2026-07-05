import { useTreeContext } from "@renderer/components/contexts/Tree"
import ContextMenu from "@renderer/components/ui/treeView/ContextMenu"
import { type MouseEvent, useCallback, useMemo, useRef, useState } from "react"
import { TreeView as React95TreeView, ScrollView } from "react95"
import type { FileTreeNode } from "@/main/types/tree"
import { collectLockedPaths, computeLockOwners, computeLockStates } from "@/renderer/lib/utils/lockStates"
import { buildTree, reportLockFailures, resolveNode } from "@/renderer/lib/utils/treeView"

/**
 * The state of the open context menu, anchored to a right-clicked node.
 */
type MenuState = {
    x: number
    y: number
    node: FileTreeNode
    canLock: boolean
    minePaths: string[]
    othersPaths: string[]
}

export default function TreeView() {
    const { fileTree, locksByPath, lock, unlock } = useTreeContext()

    const containerRef = useRef<HTMLDivElement>(null)

    const [expanded, setExpanded] = useState<string[]>([])
    const [selected, setSelected] = useState<string>()
    const [menu, setMenu] = useState<MenuState | null>(null)

    /**
     * The computed lock states for the file tree.
     */
    const lockStates = useMemo(() => computeLockStates(fileTree, locksByPath), [fileTree, locksByPath])

    /**
     * The locked-file counts by owner for every node in the file tree.
     */
    const lockOwners = useMemo(() => computeLockOwners(fileTree, locksByPath), [fileTree, locksByPath])

    /**
     * The file tree mapped to react95 tree leaves.
     */
    const tree = useMemo(
        () => buildTree(fileTree, lockStates, lockOwners, locksByPath),
        [fileTree, lockStates, lockOwners, locksByPath],
    )

    /**
     * Opens the lock/unlock context menu for the right-clicked node, if it is lockable.
     * @param event The mouse event.
     */
    const handleContextMenu = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current) return

            const node = resolveNode(event.target as HTMLElement, containerRef.current, fileTree)
            if (!node?.isLockable) return

            event.preventDefault()
            setMenu({
                x: event.clientX,
                y: event.clientY,
                node,
                canLock: (lockStates.get(node.path) ?? "unlockable") !== "locked",
                minePaths: collectLockedPaths(node, locksByPath, true),
                othersPaths: collectLockedPaths(node, locksByPath, false),
            })
        },
        [fileTree, lockStates, locksByPath],
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
        reportLockFailures(await lock([menu.node.path]))
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
        <ScrollView className="h-full w-full">
            <div ref={containerRef} onContextMenu={handleContextMenu}>
                <React95TreeView
                    tree={tree}
                    expanded={expanded}
                    selected={selected}
                    onNodeSelect={(_, id) => setSelected(id)}
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
