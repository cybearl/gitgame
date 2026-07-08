import { cn } from "@cybearl/cypack/frontend"
import fileIcon from "@react95-icons/FileText_16x16_4.png"
import folderIcon from "@react95-icons/Folder_16x16_4.png"
import lockIcon from "@react95-icons/Lock_16x16_4.png"
import Tooltip from "@renderer/components/ui/Tooltip"
import type { TreeLeaf } from "react95"
import type { LfsLock, LfsLockResult } from "@/main/types/lfs"
import type { FileTreeNode } from "@/main/types/tree"
import type { LockOwnerCount, NodeLockState } from "@/renderer/lib/utils/lockStates"

/**
 * Surfaces any failed lock/unlock results in a native error dialog.
 * @param results The per-file lock or unlock results.
 */
export function reportLockFailures(results: LfsLockResult[]) {
    const failed = results.filter(result => !result.ok)
    if (failed.length === 0) return

    const detail = failed.map(result => (result.error ? `${result.path}: ${result.error}` : result.path)).join("\n")

    window.api.dialog.error("Some files could not be updated", detail)
}

/**
 * Builds the tooltip text for a folder's lock indicator, listing the number of
 * locked files per owner within its subtree.
 * @param lockState The computed lock state of the folder.
 * @param owners The locked-file counts by owner within the folder's subtree.
 * @returns The multi-line tooltip text.
 */
function buildFolderTooltip(lockState: NodeLockState, owners: LockOwnerCount[]): string {
    const header = lockState === "partial" ? "Some files locked:" : "All files locked:"
    const lines = owners.map(({ owner, count }) => `- ${count} by ${owner}`)

    return [header, ...lines].join("\n")
}

/**
 * Renders the lock indicator shown alongside a node's label, or `undefined`
 * when the node has no active or derived lock to display.
 * @param node The file tree node.
 * @param lockState The computed lock state of the node.
 * @param fileLock The active lock on the node, if it is a locked file.
 * @param owners The locked-file counts by owner within the node's subtree.
 * @returns The lock icon element, or `undefined`.
 */
export function renderLockIcon(
    node: FileTreeNode,
    lockState: NodeLockState,
    fileLock: LfsLock | undefined,
    owners: LockOwnerCount[],
) {
    const isFolderLocked = node.type === "folder" && (lockState === "locked" || lockState === "partial")

    if (node.type === "file" && !fileLock) return undefined
    if (!fileLock && !isFolderLocked) return undefined

    const text = fileLock
        ? fileLock.isMine
            ? `Locked by you (${fileLock.owner})`
            : `Locked by ${fileLock.owner}`
        : buildFolderTooltip(lockState, owners)

    return (
        <Tooltip text={text}>
            <img
                src={lockIcon}
                alt="Locked"
                decoding="sync"
                fetchPriority="high"
                className={cn(
                    "size-4 [image-rendering:pixelated]",
                    fileLock && !fileLock.isMine && "opacity-60",
                    lockState === "partial" && "opacity-40",
                )}
            />
        </Tooltip>
    )
}

/**
 * Renders the default type icon shown when a node has no lock indicator to
 * display, picking the folder or file variant based on the node's type.
 * @param node The file tree node.
 * @returns The type icon element.
 */
export function renderTypeIcon(node: FileTreeNode) {
    return (
        <img
            src={node.type === "folder" ? folderIcon : fileIcon}
            alt=""
            decoding="sync"
            fetchPriority="high"
            className="size-4 [image-rendering:pixelated]"
        />
    )
}

/**
 * Maps the repository file tree to the leaf shape consumed by react95's
 * `TreeView`, keyed by repository-relative path and carrying either a lock
 * indicator or the default folder/file icon.
 * @param nodes The file tree nodes to map.
 * @param lockStates The computed lock states keyed by path.
 * @param lockOwners The locked-file counts by owner keyed by path.
 * @param locksByPath The active locks keyed by path.
 * @returns The react95 tree leaves.
 */
export function buildTree(
    nodes: FileTreeNode[],
    lockStates: Map<string, NodeLockState>,
    lockOwners: Map<string, LockOwnerCount[]>,
    locksByPath: Map<string, LfsLock>,
): TreeLeaf<string>[] {
    return nodes.map(node => {
        const lockState = lockStates.get(node.path) ?? "unlockable"
        const fileLock = node.type === "file" ? locksByPath.get(node.path) : undefined
        const owners = lockOwners.get(node.path) ?? []

        return {
            id: node.path,
            label: node.name,
            icon: renderLockIcon(node, lockState, fileLock, owners) ?? renderTypeIcon(node),
            items: node.children ? buildTree(node.children, lockStates, lockOwners, locksByPath) : undefined,
        }
    })
}

/**
 * Locates a file tree node by its repository-relative path, walking the tree
 * depth-first from the given roots.
 * @param roots The root-level file tree nodes.
 * @param path The repository-relative path to locate.
 * @returns The matching node, or `undefined` if no node has that path.
 */
export function findNodeByPath(roots: FileTreeNode[], path: string): FileTreeNode | undefined {
    for (const node of roots) {
        if (node.path === path) return node

        if (node.children) {
            const found = findNodeByPath(node.children, path)
            if (found) return found
        }
    }

    return undefined
}

/**
 * Resolves the file tree node under a right-click by mapping the DOM position of
 * the target tree item back through the tree by sibling index at each level.
 * @param target The event target that was right-clicked.
 * @param container The root element wrapping the tree.
 * @param roots The root-level file tree nodes.
 * @returns The matching node, or `null` if the click was outside a tree item.
 */
export function resolveNode(target: HTMLElement, container: HTMLElement, roots: FileTreeNode[]): FileTreeNode | null {
    const indices: number[] = []

    let item = target.closest<HTMLElement>('li[role="treeitem"]')
    while (item && container.contains(item)) {
        const list = item.parentElement
        if (!list) break

        const siblings = Array.from(list.children).filter(child => child.getAttribute("role") === "treeitem")
        indices.unshift(siblings.indexOf(item))

        if (list.getAttribute("role") === "tree") break

        item = list.closest<HTMLElement>('li[role="treeitem"]')
    }

    let nodes: FileTreeNode[] | undefined = roots
    let node: FileTreeNode | null = null

    for (const index of indices) {
        node = nodes?.[index] ?? null
        if (!node) return null
        nodes = node.children
    }

    return node
}
