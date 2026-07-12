import { useProjectContext } from "@renderer/components/contexts/Project"
import { useStatusContext } from "@renderer/components/contexts/Status"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react"
import type { FileTreeNode } from "@/main/types/fileTree"
import type { LfsLock, LfsLockResult } from "@/main/types/lfsCommands"
import { indexLocks } from "@/renderer/lib/utils/lockStates"

/**
 * The type for the tree context.
 */
export type FileTreeContextType = {
    fileTree: FileTreeNode[]
    locksByPath: Map<string, LfsLock>
    isLoading: boolean
    error: Error | null
    refresh: () => Promise<void>
    lock: (paths: string[]) => Promise<LfsLockResult[]>
    unlock: (paths: string[], force?: boolean) => Promise<LfsLockResult[]>
}

/**
 * The `Tree` context, providing the current repository's file tree and its Git
 * LFS lock state.
 */
export const FileTreeContext = createContext<FileTreeContextType | undefined>(undefined)

/**
 * The props for the `FileTreeProvider` component.
 */
type FileTreeProviderProps = {
    children: ReactNode
}

export default function FileTreeProvider({ children }: FileTreeProviderProps) {
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
    const [locksByPath, setLocksByPath] = useState<Map<string, LfsLock>>(new Map())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const { currentProject } = useProjectContext()
    const { runTask } = useStatusContext()

    /**
     * Reloads just the LFS locks for the current project.
     */
    const refreshLocks = useCallback(async () => {
        if (!currentProject?.path) {
            setLocksByPath(new Map())
            return
        }

        try {
            setLocksByPath(indexLocks(await window.api.lfsCommands.listLocks(currentProject.path)))
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        }
    }, [currentProject?.path])

    /**
     * Reloads the file tree and the LFS locks for the current project,
     * migrating any locks held on staged renames to their new path so a locked
     * file keeps its lock after being renamed.
     */
    const refresh = useCallback(async () => {
        setError(null)

        if (!currentProject?.path) {
            setFileTree([])
            setLocksByPath(new Map())
            return
        }

        setIsLoading(true)

        // Sets the cached locks immediately if available
        try {
            setLocksByPath(indexLocks(await window.api.lfsCommands.getCachedLocks(currentProject.path)))
        } catch {
            // A cache miss is expected on first-ever open and must not block refresh
        }

        // The tree and the locks load in parallel so a slow git-lfs call does not
        // delay the tree render, and each surfaces as soon as it is ready
        const treePromise = window.api.fileTree
            .get(currentProject.path)
            .then(setFileTree)
            .catch(err => setError(err instanceof Error ? err : new Error(String(err))))

        await Promise.all([treePromise, refreshLocks()])

        // Carries locks across staged renames, then re-reads the locks if any
        // migration actually moved a lock so the tree overlays the new paths
        try {
            const migrations = await window.api.lfsCommands.migrateLocks(currentProject.path)
            if (migrations.some(m => m.status === "migrated" || m.status === "failed-unlock")) {
                await refreshLocks()
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        }

        setIsLoading(false)
    }, [refreshLocks, currentProject?.path])

    /**
     * Locks the given paths, then refreshes the lock state.
     * @param paths The repository-relative paths to lock (files or folders).
     */
    const lock = useCallback(
        async (paths: string[]): Promise<LfsLockResult[]> => {
            if (!currentProject?.path) return []

            const label = `Locking ${paths.length} ${paths.length === 1 ? "file" : "files"}...`

            try {
                return await runTask(label, async () => {
                    const results = await window.api.lfsCommands.lockPaths(currentProject?.path ?? null, paths)
                    await refreshLocks()
                    return results
                })
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)))
                return []
            }
        },
        [currentProject?.path, refreshLocks, runTask],
    )

    /**
     * Unlocks the given paths, then refreshes the lock state.
     * @param paths The repository-relative paths to unlock (files or folders).
     * @param force Whether to force-unlock files locked by other users.
     */
    const unlock = useCallback(
        async (paths: string[], force?: boolean): Promise<LfsLockResult[]> => {
            if (!currentProject?.path) return []

            const verb = force ? "Force-unlocking" : "Unlocking"
            const label = `${verb} ${paths.length} ${paths.length === 1 ? "file" : "files"}...`

            try {
                return await runTask(label, async () => {
                    const results = await window.api.lfsCommands.unlockPaths(currentProject?.path ?? null, paths, force)
                    await refreshLocks()
                    return results
                })
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)))
                return []
            }
        },
        [currentProject?.path, refreshLocks, runTask],
    )

    // Reload whenever the current project changes
    useEffect(() => {
        refresh()
    }, [refresh])

    return (
        <FileTreeContext.Provider
            value={{
                fileTree,
                locksByPath,
                isLoading,
                error,
                refresh,
                lock,
                unlock,
            }}
        >
            {children}
        </FileTreeContext.Provider>
    )
}

/**
 * A custom hook to access the repository file tree and lock state from the `FileTreeContext`.
 * @returns The tree context value.
 */
export function useFileTreeContext() {
    const ctx = useContext(FileTreeContext)
    if (ctx === undefined) throw new Error("'useFileTreeContext' must be used within a 'FileTreeProvider'")
    return ctx
}
