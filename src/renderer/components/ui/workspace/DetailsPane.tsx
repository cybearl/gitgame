import { cn } from "@cybearl/cypack/frontend"
import lockIcon from "@react95-icons/Lock_16x16_4.png"
import refreshIcon from "@react95-icons/Refresh_16x16_4.png"
import { useProjectContext } from "@renderer/components/contexts/Project"
import { useTreeContext } from "@renderer/components/contexts/Tree"
import Tooltip from "@renderer/components/ui/Tooltip"
import { useCallback, useMemo } from "react"
import { Button, GroupBox, ScrollView, Separator, Toolbar } from "react95"
import type { FileTreeNode } from "@/main/types/tree"
import { collectLockablePaths, collectLockedPaths } from "@/renderer/lib/utils/lockStates"
import { reportLockFailures } from "@/renderer/lib/utils/treeView"

type DetailsPaneProps = {
    selectedNode: FileTreeNode | undefined
    className?: string
}

export default function DetailsPane({ selectedNode, className }: DetailsPaneProps) {
    const { currentProject } = useProjectContext()
    const { locksByPath, refresh, lock, unlock } = useTreeContext()

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
     * The overall lock counts across the whole project, split between the
     * current user and others.
     */
    const overallCounts = useMemo(() => {
        let mine = 0
        let others = 0

        for (const entry of locksByPath.values()) {
            if (entry.isMine) mine++
            else others++
        }

        return { mine, others }
    }, [locksByPath])

    /**
     * The active lock on the selected node when it is a locked file, or
     * `undefined` for folders and unlocked files.
     */
    const selectedFileLock = useMemo(() => {
        if (selectedNode?.type !== "file") return undefined
        return locksByPath.get(selectedNode.path)
    }, [selectedNode, locksByPath])

    /**
     * The formatted local timestamp for the selected file's lock, if any.
     */
    const lockedAtLabel = useMemo(() => {
        if (!selectedFileLock?.lockedAt) return null
        return new Date(selectedFileLock.lockedAt).toLocaleString()
    }, [selectedFileLock])

    /**
     * Refreshes the file tree and its lock state.
     */
    const handleRefresh = useCallback(() => {
        refresh()
    }, [refresh])

    /**
     * Locks every lockable file within the selected subtree.
     */
    const handleLock = useCallback(async () => {
        reportLockFailures(await lock(lockablePaths))
    }, [lock, lockablePaths])

    /**
     * Unlocks every file within the selected subtree locked by the current user.
     */
    const handleUnlock = useCallback(async () => {
        reportLockFailures(await unlock(minePaths, false))
    }, [unlock, minePaths])

    /**
     * Force-unlocks every file within the selected subtree locked by other
     * users, after native confirmation.
     */
    const handleForceUnlock = useCallback(async () => {
        const confirmed = await window.api.dialog.confirm({
            title: "Force unlock",
            message: `Force unlock ${othersPaths.length} file${othersPaths.length === 1 ? "" : "s"} locked by other users?`,
            detail: "Forcing may discard work the lock owner has not pushed yet.",
            confirmLabel: "Force unlock",
            isDestructive: true,
        })

        if (!confirmed) return

        reportLockFailures(await unlock(othersPaths, true))
    }, [unlock, othersPaths])

    return (
        <div className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
            <Toolbar className="gap-0.5!">
                <Tooltip text="Refresh">
                    <Button variant="flat" size="sm" square onClick={handleRefresh}>
                        <img
                            src={refreshIcon}
                            alt=""
                            decoding="sync"
                            fetchPriority="high"
                            className="size-4 [image-rendering:pixelated]"
                        />
                    </Button>
                </Tooltip>

                <Separator orientation="vertical" />

                <Button
                    variant="flat"
                    size="sm"
                    disabled={
                        lockablePaths.length === 0 || minePaths.length + othersPaths.length >= lockablePaths.length
                    }
                    onClick={handleLock}
                >
                    <img
                        src={lockIcon}
                        alt=""
                        decoding="sync"
                        fetchPriority="high"
                        className="mr-1 size-4 [image-rendering:pixelated]"
                    />
                    Lock
                </Button>

                <Button variant="flat" size="sm" disabled={minePaths.length === 0} onClick={handleUnlock}>
                    Unlock
                </Button>

                <Button variant="flat" size="sm" disabled={othersPaths.length === 0} onClick={handleForceUnlock}>
                    Force unlock
                </Button>
            </Toolbar>

            <Separator />

            <ScrollView className="min-h-0 flex-1 [&>div]:relative [&>div]:z-10">
                <div className="p-3">
                    {selectedNode ? (
                        <GroupBox
                            label={selectedNode.type === "folder" ? "Folder" : "File"}
                            className="flex flex-col gap-2"
                        >
                            <div className="flex flex-col gap-1 text-sm">
                                <div>
                                    <span className="opacity-60">Name: </span>
                                    <span>{selectedNode.name}</span>
                                </div>

                                <div className="break-all">
                                    <span className="opacity-60">Path: </span>
                                    <span>{selectedNode.path}</span>
                                </div>

                                <div>
                                    <span className="opacity-60">Lockable: </span>
                                    <span>{selectedNode.isLockable ? "Yes" : "No"}</span>
                                </div>

                                {selectedNode.type === "file" && selectedFileLock && (
                                    <>
                                        <div>
                                            <span className="opacity-60">Locked by: </span>
                                            <span>
                                                {selectedFileLock.isMine
                                                    ? `${selectedFileLock.owner} (you)`
                                                    : selectedFileLock.owner}
                                            </span>
                                        </div>

                                        {lockedAtLabel && (
                                            <div>
                                                <span className="opacity-60">Locked at: </span>
                                                <span>{lockedAtLabel}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedNode.type === "folder" && (
                                    <>
                                        <div>
                                            <span className="opacity-60">Lockable files: </span>
                                            <span>{lockablePaths.length}</span>
                                        </div>

                                        <div>
                                            <span className="opacity-60">Locked by you: </span>
                                            <span>{minePaths.length}</span>
                                        </div>

                                        <div>
                                            <span className="opacity-60">Locked by others: </span>
                                            <span>{othersPaths.length}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </GroupBox>
                    ) : (
                        <GroupBox label="Project" className="flex flex-col gap-2">
                            <div className="flex flex-col gap-1 text-sm">
                                <div>
                                    <span className="opacity-60">Name: </span>
                                    <span>{currentProject?.name ?? "No project open"}</span>
                                </div>

                                {currentProject?.path && (
                                    <div className="break-all">
                                        <span className="opacity-60">Path: </span>
                                        <span>{currentProject.path}</span>
                                    </div>
                                )}

                                <div>
                                    <span className="opacity-60">Locked by you: </span>
                                    <span>{overallCounts.mine}</span>
                                </div>

                                <div>
                                    <span className="opacity-60">Locked by others: </span>
                                    <span>{overallCounts.others}</span>
                                </div>
                            </div>

                            <div className="mt-2 text-xs opacity-60">
                                Select a file or folder in the tree to see its lock details.
                            </div>
                        </GroupBox>
                    )}
                </div>
            </ScrollView>
        </div>
    )
}
