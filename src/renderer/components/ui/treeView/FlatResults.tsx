import { cn } from "@cybearl/cypack/frontend"
import { renderLockIcon, renderTypeIcon } from "@renderer/lib/utils/treeView"
import type { MouseEvent } from "react"
import type { LfsLock } from "@/main/types/lfs"
import type { FileTreeNode } from "@/main/types/tree"
import type { LockOwnerCount, NodeLockState } from "@/renderer/lib/utils/lockStates"

/**
 * The props for the `FlatResults` component.
 */
type FlatResultsProps = {
    matches: FileTreeNode[]
    selected: string | undefined
    onSelect: (id: string) => void
    onContextMenu: (event: MouseEvent<HTMLElement>, node: FileTreeNode) => void
    lockStates: Map<string, NodeLockState>
    lockOwners: Map<string, LockOwnerCount[]>
    locksByPath: Map<string, LfsLock>
}

export default function FlatResults({
    matches,
    selected,
    onSelect,
    onContextMenu,
    lockStates,
    lockOwners,
    locksByPath,
}: FlatResultsProps) {
    if (matches.length === 0) {
        return <div className="px-2 py-1 text-sm opacity-60">No matches</div>
    }

    return (
        <div role="listbox" className="flex flex-col">
            {matches.map(node => {
                const isSelected = selected === node.path
                const lockState = lockStates.get(node.path) ?? "unlockable"
                const fileLock = locksByPath.get(node.path)
                const owners = lockOwners.get(node.path) ?? []
                const icon = renderLockIcon(node, lockState, fileLock, owners) ?? renderTypeIcon(node)

                const separatorIndex = node.path.lastIndexOf("/")
                const parentPath = separatorIndex >= 0 ? node.path.slice(0, separatorIndex) : ""

                return (
                    <button
                        key={node.path}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                            "flex flex-col w-full gap-0.5 border-0 bg-transparent px-2 py-1 text-left",
                            "cursor-pointer font-inherit",
                        )}
                        onClick={() => onSelect(node.path)}
                        onContextMenu={event => onContextMenu(event, node)}
                    >
                        <div className="flex w-full gap-1.5 items-center">
                            <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
                            <span className="shrink-0 truncate">{node.name}</span>
                        </div>
                        {parentPath && <span className="truncate opacity-60 text-xs">{parentPath}</span>}
                    </button>
                )
            })}
        </div>
    )
}
