import { useFileTreeContext } from "@renderer/components/contexts/FileTree"
import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import { useCallback, useMemo } from "react"
import { collectLockablePaths, collectLockedPaths } from "@/renderer/lib/utils/lockStates"
import { reportLockFailures } from "@/renderer/lib/utils/treeView"

/**
 * The value returned by the `useSelectionLocks` hook.
 */
type UseSelectionLocksResult = {
    lockablePaths: string[]
    minePaths: string[]
    othersPaths: string[]
    lockSelection: () => Promise<void>
    unlockSelection: () => Promise<void>
    forceUnlockSelection: () => Promise<void>
}

/**
 * Derives the lockable and locked paths within the selected node's subtree and
 * exposes the lock actions operating on them, every path set is empty while
 * nothing is selected, which leaves the actions inert.
 * @returns The selection's path sets, and its lock, unlock and force-unlock actions.
 */
export default function useSelectionLocks(): UseSelectionLocksResult {
    const { locksByPath, lock, unlock } = useFileTreeContext()
    const { selectedNode } = useTreeViewContext()

    /**
     * The lockable file paths within the selected node's subtree, empty when
     * nothing is selected.
     */
    const lockablePaths = useMemo(() => (selectedNode ? collectLockablePaths(selectedNode) : []), [selectedNode])

    /**
     * The paths within the selected subtree locked by the current user.
     */
    const minePaths = useMemo(
        () => (selectedNode ? collectLockedPaths(selectedNode, locksByPath, true) : []),
        [selectedNode, locksByPath],
    )

    /**
     * The paths within the selected subtree locked by other users.
     */
    const othersPaths = useMemo(
        () => (selectedNode ? collectLockedPaths(selectedNode, locksByPath, false) : []),
        [selectedNode, locksByPath],
    )

    /**
     * Locks every lockable file within the selected subtree.
     */
    const lockSelection = useCallback(async () => {
        reportLockFailures(await lock(lockablePaths))
    }, [lock, lockablePaths])

    /**
     * Unlocks every file within the selected subtree locked by the current user.
     */
    const unlockSelection = useCallback(async () => {
        reportLockFailures(await unlock(minePaths, false))
    }, [unlock, minePaths])

    /**
     * Force-unlocks every file within the selected subtree locked by other
     * users, after native confirmation.
     */
    const forceUnlockSelection = useCallback(async () => {
        const confirmed = await window.api.dialogs.confirm({
            title: "Force unlock",
            message: `Force unlock ${othersPaths.length} file${othersPaths.length === 1 ? "" : "s"} locked by other users?`,
            details: "Forcing may discard work the lock owner has not pushed yet.",
            confirmLabel: "Force unlock",
            isDestructive: true,
        })

        if (!confirmed) return

        reportLockFailures(await unlock(othersPaths, true))
    }, [unlock, othersPaths])

    return {
        lockablePaths,
        minePaths,
        othersPaths,
        lockSelection,
        unlockSelection,
        forceUnlockSelection,
    }
}
