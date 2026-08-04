import { useFileTreeContext } from "@renderer/components/contexts/FileTree"
import DetailsRow from "@renderer/components/panes/details/Row"
import { useMemo } from "react"
import { GroupBox } from "react95"
import type { FileTreeNode } from "@/main/types/fileTree"

type NodeSectionProps = {
    node: FileTreeNode
    lockablePaths: string[]
    minePaths: string[]
    othersPaths: string[]
}

export default function NodeSection({ node, lockablePaths, minePaths, othersPaths }: NodeSectionProps) {
    const { locksByPath } = useFileTreeContext()

    /**
     * The active lock on the node when it is a locked file, or `undefined` for
     * folders and unlocked files.
     */
    const nodeLock = useMemo(() => {
        if (node.type !== "file") return undefined
        return locksByPath.get(node.path)
    }, [node, locksByPath])

    /**
     * The formatted local timestamp for the node's lock, if any.
     */
    const lockedAtLabel = useMemo(() => {
        if (!nodeLock?.lockedAt) return null
        return new Date(nodeLock.lockedAt).toLocaleString()
    }, [nodeLock])

    return (
        <GroupBox label={node.type === "folder" ? "Folder" : "File"} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 text-sm">
                <DetailsRow label="Name" value={node.name} />
                <DetailsRow label="Path" value={node.path} className="break-all" />
                <DetailsRow label="Lockable" value={node.isLockable ? "Yes" : "No"} />

                {nodeLock && (
                    <>
                        <DetailsRow
                            label="Locked by"
                            value={nodeLock.isMine ? `${nodeLock.owner} (you)` : nodeLock.owner}
                        />

                        {lockedAtLabel && <DetailsRow label="Locked at" value={lockedAtLabel} />}
                    </>
                )}

                {node.type === "folder" && (
                    <>
                        <DetailsRow label="Lockable files" value={lockablePaths.length} />
                        <DetailsRow label="Locked by you" value={minePaths.length} />
                        <DetailsRow label="Locked by others" value={othersPaths.length} />
                    </>
                )}
            </div>
        </GroupBox>
    )
}
