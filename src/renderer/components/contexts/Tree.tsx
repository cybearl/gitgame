import { useProjectContext } from "@renderer/components/contexts/Project"
import { useStatusContext } from "@renderer/components/contexts/Status"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react"
import type { LfsLock, LfsLockResult } from "@/main/types/lfs"
import type { FileTreeNode } from "@/main/types/tree"
import { indexLocks } from "@/renderer/lib/utils/lockStates"

/**
 * The type for the tree context.
 */
export type TreeContextType = {
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
export const TreeContext = createContext<TreeContextType | undefined>(undefined)

/**
 * The props for the `TreeProvider` component.
 */
type TreeProviderProps = {
    children: ReactNode
}

export default function TreeProvider({ children }: TreeProviderProps) {
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
            setLocksByPath(indexLocks(await window.api.lfs.listLocks(currentProject?.path ?? null)))
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        }
    }, [currentProject?.path])

    /**
     * Reloads the file tree and the LFS locks for the current project.
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
            setLocksByPath(indexLocks(await window.api.lfs.getCachedLocks(currentProject?.path ?? null)))
        } catch {
            // A cache miss is expected on first-ever open and must not block refresh
        }

        // The tree and the locks load in parallel so a slow git-lfs call does not
        // delay the tree render, and each surfaces as soon as it is ready
        const treePromise = window.api.tree
            .getFileTree(currentProject?.path ?? null)
            .then(setFileTree)
            .catch(err => setError(err instanceof Error ? err : new Error(String(err))))

        await Promise.all([treePromise, refreshLocks()])

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
                    const results = await window.api.lfs.lockPaths(currentProject?.path ?? null, paths)
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
                    const results = await window.api.lfs.unlockPaths(currentProject?.path ?? null, paths, force)
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
        <TreeContext.Provider
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
        </TreeContext.Provider>
    )
}

/**
 * A custom hook to access the repository file tree and lock state from the `TreeContext`.
 * @returns The tree context value.
 */
export function useTreeContext() {
    const ctx = useContext(TreeContext)
    if (ctx === undefined) throw new Error("'useTreeContext' must be used within a 'TreeProvider'")
    return ctx
}
