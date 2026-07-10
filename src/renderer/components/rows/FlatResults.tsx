import { cn } from "@cybearl/cypack/frontend"
import { useFileTreeContext } from "@renderer/components/contexts/FileTree"
import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import { renderLockIcon, renderTypeIcon } from "@renderer/lib/utils/treeView"
import { useMemo } from "react"
import type { RowComponentProps } from "react-window"
import type { FileTreeNode } from "@/main/types/fileTree"

/**
 * The shared per-row data forwarded to every virtualized row by react-window's
 * `rowProps`, so each row renders from the same source-of-truth without new
 * closures per render.
 */
export type FlatResultsRowData = {
    matches: FileTreeNode[]
}

export default function FlatResultsRow({ index, style, matches }: RowComponentProps<FlatResultsRowData>) {
    const { locksByPath } = useFileTreeContext()
    const { selectedPath, lockStates, lockOwners, select, openMenu } = useTreeViewContext()

    /**
     * The file tree node for the current row.
     */
    const node = useMemo(() => matches[index], [matches, index])

    /**
     * The lock state of the current node.
     */
    const lockState = useMemo(() => lockStates.get(node.path) ?? "unlockable", [lockStates, node.path])

    /**
     * The file lock information for the current node.
     */
    const fileLock = useMemo(() => locksByPath.get(node.path), [locksByPath, node.path])

    /**
     * The list of users who own locks on this file.
     */
    const owners = useMemo(() => lockOwners.get(node.path) ?? [], [lockOwners, node.path])

    /**
     * The icon to display for the file, based on its lock state and type.
     */
    const icon = useMemo(
        () => renderLockIcon(node, lockState, fileLock, owners) ?? renderTypeIcon(node),
        [node, lockState, fileLock, owners],
    )

    /**
     * The index of the last separator in the file path.
     */
    const separatorIndex = useMemo(() => node.path.lastIndexOf("/"), [node.path])

    /**
     * The parent directory of the current file.
     */
    const parentPath = useMemo(
        () => (separatorIndex >= 0 ? node.path.slice(0, separatorIndex) : ""),
        [separatorIndex, node.path],
    )

    return (
        <button
            type="button"
            role="option"
            aria-selected={selectedPath === node.path}
            style={style}
            className={cn(
                "flex w-full flex-col gap-0.5 border-0 bg-transparent px-2 py-1 text-left",
                "cursor-pointer font-inherit",
            )}
            onClick={() => select(node.path)}
            onContextMenu={event => openMenu(event, node)}
        >
            <div className="flex w-full items-center gap-1.5">
                <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
                <span className="min-w-0 truncate">{node.name}</span>
            </div>
            {parentPath && <span className="truncate text-xs opacity-60">{parentPath}</span>}
        </button>
    )
}
