/**
 * Whether a file tree node is a file or a folder.
 */
export type FileTreeNodeType = "file" | "folder"

/**
 * A node in the repository file tree, `isLockable` reflects the `lockable` Git
 * attribute on files, and is `true` on folders with at least one lockable descendant.
 */
export type FileTreeNode = {
    name: string
    path: string
    type: FileTreeNodeType
    isLockable: boolean
    children?: FileTreeNode[]
}
