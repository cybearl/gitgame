/**
 * Whether a file tree node is a file or a folder.
 */
export type FileTreeNodeType = "file" | "folder"

/**
 * A node in the repository file tree.
 *
 * For a file, `isLockable` reflects its `lockable` Git attribute, for a folder,
 * `isLockable` is `true` when it contains at least one lockable descendant, so
 * the UI knows whether a folder-level lock button is meaningful.
 */
export type FileTreeNode = {
    name: string
    path: string
    type: FileTreeNodeType
    isLockable: boolean
    children?: FileTreeNode[]
}
