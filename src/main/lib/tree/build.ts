import type { FileTreeNode } from "@/main/types/tree"

/**
 * A mutable tree node used while assembling the tree, keyed children included.
 */
type MutableNode = {
    name: string
    path: string
    type: "file" | "folder"
    isLockable: boolean
    children?: Map<string, MutableNode>
}

/**
 * Materializes a level of mutable nodes into sorted, immutable `FileTreeNode`s,
 * deriving each folder's `isLockable` from its descendants (bottom-up).
 * @param level The mutable nodes at this level, keyed by name.
 * @returns The sorted file tree nodes.
 */
function materialize(level: Map<string, MutableNode>): FileTreeNode[] {
    const nodes: FileTreeNode[] = []

    for (const node of level.values()) {
        if (node.type === "folder" && node.children) {
            const children = materialize(node.children)
            nodes.push({
                name: node.name,
                path: node.path,
                type: "folder",
                isLockable: children.some(child => child.isLockable),
                children,
            })
        } else {
            nodes.push({
                name: node.name,
                path: node.path,
                type: "file",
                isLockable: node.isLockable,
            })
        }
    }

    // Sort the nodes (folder first, then files in alphabetical order)
    nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    })

    return nodes
}

/**
 * Builds a nested file tree from a flat list of repository-relative file paths.
 * @param files The repository-relative file paths (POSIX separators).
 * @param lockable The set of paths whose `lockable` attribute is set.
 * @returns The root-level file tree nodes.
 */
export function buildFileTree(files: string[], lockable: Set<string>): FileTreeNode[] {
    const root = new Map<string, MutableNode>()

    for (const file of files) {
        const segments = file.split("/")
        let level = root
        let currentPath = ""

        for (let i = 0; i < segments.length; i++) {
            const name = segments[i]
            currentPath = currentPath ? `${currentPath}/${name}` : name
            const isLeaf = i === segments.length - 1

            let node = level.get(name)
            if (!node) {
                node = {
                    name,
                    path: currentPath,
                    type: isLeaf ? "file" : "folder",
                    isLockable: isLeaf ? lockable.has(currentPath) : false,
                    children: isLeaf ? undefined : new Map(),
                }
                level.set(name, node)
            }

            if (!isLeaf && node.children) level = node.children
        }
    }

    return materialize(root)
}
