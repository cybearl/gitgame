import type { LfsLock } from "@/main/types/lfs"
import type { FileTreeNode } from "@/main/types/tree"

/**
 * The lock state of a tree node:
 * - `unlockable`: the node has nothing lockable (no lock button).
 * - `unlocked`: lockable, but nothing is locked.
 * - `locked`: fully locked (a file, or a folder whose lockable descendants are all locked).
 * - `partial`: a folder with some, but not all, lockable descendants locked.
 */
export type NodeLockState = "unlockable" | "unlocked" | "locked" | "partial"

/**
 * The number of locked files held by a single owner within a node's subtree.
 */
export type LockOwnerCount = {
    owner: string
    count: number
}

/**
 * Computes the lock state of every node in the tree in a single pass, deriving
 * folder states from their descendants.
 * @param nodes The root-level file tree nodes.
 * @param locksByPath The active locks keyed by repository-relative path.
 * @returns A map from node path to its lock state.
 */
export function computeLockStates(
    nodes: FileTreeNode[],
    locksByPath: Map<string, LfsLock>,
): Map<string, NodeLockState> {
    const states = new Map<string, NodeLockState>()

    /**
     * Records the state of a node and returns its `[lockable, locked]` counts.
     * @param node The node to visit.
     * @returns The count of lockable and locked files within the node's subtree.
     */
    const visit = (node: FileTreeNode): [number, number] => {
        if (node.type === "file") {
            if (!node.isLockable) {
                states.set(node.path, "unlockable")
                return [0, 0]
            }

            const locked = locksByPath.has(node.path)
            states.set(node.path, locked ? "locked" : "unlocked")
            return [1, locked ? 1 : 0]
        }

        let lockable = 0
        let locked = 0

        for (const child of node.children ?? []) {
            const [childLockable, childLocked] = visit(child)
            lockable += childLockable
            locked += childLocked
        }

        let state: NodeLockState
        if (lockable === 0) state = "unlockable"
        else if (locked === 0) state = "unlocked"
        else if (locked === lockable) state = "locked"
        else state = "partial"

        states.set(node.path, state)
        return [lockable, locked]
    }

    for (const node of nodes) visit(node)

    return states
}

/**
 * Computes, for every node in the tree, the breakdown of locked files by owner
 * within its subtree, sorted by descending count then owner name.
 * @param nodes The root-level file tree nodes.
 * @param locksByPath The active locks keyed by repository-relative path.
 * @returns A map from node path to its owner lock counts.
 */
export function computeLockOwners(
    nodes: FileTreeNode[],
    locksByPath: Map<string, LfsLock>,
): Map<string, LockOwnerCount[]> {
    const owners = new Map<string, LockOwnerCount[]>()

    /**
     * Records the owner breakdown of a node and returns its locked-file counts by owner.
     * @param node The node to visit.
     * @returns The count of locked files by owner within the node's subtree.
     */
    const visit = (node: FileTreeNode): Map<string, number> => {
        const counts = new Map<string, number>()

        if (node.type === "file") {
            const lock = locksByPath.get(node.path)
            if (lock) counts.set(lock.owner, 1)
        } else {
            for (const child of node.children ?? []) {
                for (const [owner, count] of visit(child)) {
                    counts.set(owner, (counts.get(owner) ?? 0) + count)
                }
            }
        }

        const sorted = Array.from(counts, ([owner, count]) => ({ owner, count })).sort(
            (a, b) => b.count - a.count || a.owner.localeCompare(b.owner),
        )

        owners.set(node.path, sorted)
        return counts
    }

    for (const node of nodes) visit(node)

    return owners
}

/**
 * Collects the paths of every locked file within a node's subtree, filtered by
 * whether the current user owns the lock.
 * @param node The node whose subtree to scan.
 * @param locksByPath The active locks keyed by repository-relative path.
 * @param mine Whether to collect the current user's locks (`true`) or others' locks (`false`).
 * @returns The matching locked-file paths.
 */
export function collectLockedPaths(node: FileTreeNode, locksByPath: Map<string, LfsLock>, mine: boolean): string[] {
    const paths: string[] = []

    /**
     * Appends the node's path when it is a matching locked file, then recurses.
     * @param current The node to visit.
     */
    const visit = (current: FileTreeNode) => {
        if (current.type === "file") {
            const lock = locksByPath.get(current.path)
            if (lock && lock.isMine === mine) paths.push(current.path)
            return
        }

        for (const child of current.children ?? []) visit(child)
    }

    visit(node)

    return paths
}
