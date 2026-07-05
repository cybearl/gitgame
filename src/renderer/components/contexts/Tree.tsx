import { useProjectContext } from "@renderer/components/contexts/Project"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react"
import type { LfsLock, LfsLockResult } from "@/main/types/lfs"
import type { FileTreeNode } from "@/main/types/tree"

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
    const { currentProject } = useProjectContext()
    const projectPath = currentProject?.path ?? null

    const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
    const [locksByPath, setLocksByPath] = useState<Map<string, LfsLock>>(new Map())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    /**
     * Reloads just the LFS locks for the current project.
     */
    const refreshLocks = useCallback(async () => {
        if (!projectPath) {
            setLocksByPath(new Map())
            return
        }

        try {
            const locks = await window.api.lfs.listLocks(projectPath)
            setLocksByPath(new Map(locks.map(lock => [lock.path, lock])))
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        }
    }, [projectPath])

    /**
     * Reloads the file tree and the LFS locks for the current project.
     */
    const refresh = useCallback(async () => {
        setError(null)

        if (!projectPath) {
            setFileTree([])
            setLocksByPath(new Map())
            return
        }

        setIsLoading(true)

        // The tree loads independently of the locks so a locks/remote failure
        // does not blank out the tree
        try {
            setFileTree(await window.api.tree.getFileTree(projectPath))
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        }

        await refreshLocks()

        setIsLoading(false)
    }, [projectPath, refreshLocks])

    /**
     * Locks the given paths, then refreshes the lock state.
     * @param paths The repository-relative paths to lock (files or folders).
     */
    const lock = useCallback(
        async (paths: string[]): Promise<LfsLockResult[]> => {
            if (!projectPath) return []

            try {
                const results = await window.api.lfs.lockPaths(projectPath, paths)
                await refreshLocks()
                return results
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)))
                return []
            }
        },
        [projectPath, refreshLocks],
    )

    /**
     * Unlocks the given paths, then refreshes the lock state.
     * @param paths The repository-relative paths to unlock (files or folders).
     * @param force Whether to force-unlock files locked by other users.
     */
    const unlock = useCallback(
        async (paths: string[], force?: boolean): Promise<LfsLockResult[]> => {
            if (!projectPath) return []

            try {
                const results = await window.api.lfs.unlockPaths(projectPath, paths, force)
                await refreshLocks()
                return results
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)))
                return []
            }
        },
        [projectPath, refreshLocks],
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
