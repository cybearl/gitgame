import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { getLockableFiles, listLocks, lockPaths, migrateLocks, unlockPaths } from "@main/lib/lfsCommands/service"
import { cacheStore } from "@main/lib/stores/cache"
import type { LfsLockProgress } from "@/main/types/lfsCommands"

/**
 * Registers the IPC handlers for the Git LFS locking service.
 */
export function registerLfsCommandsHandlers() {
    safeHandle(CONSTANTS.ipc.lfsCommandsListLocks, async (_event, dir: string) => {
        const locks = await listLocks(dir)

        cacheStore.update(cache => {
            cache.lfsLocks[dir] = locks
            return cache
        })

        return locks
    })

    safeHandle(CONSTANTS.ipc.lfsCommandsGetCachedLocks, async (_event, dir: string) => {
        const { lfsLocks } = await cacheStore.get()
        return lfsLocks[dir] ?? []
    })

    safeHandle(CONSTANTS.ipc.lfsCommandsGetLockableFiles, (_event, dir: string) => getLockableFiles(dir))

    safeHandle(CONSTANTS.ipc.lfsCommandsLockPaths, (event, dir: string, paths: string[], requestId: string | null) =>
        lockPaths(dir, paths, (done, total) => {
            if (!requestId || event.sender.isDestroyed()) return
            const payload: LfsLockProgress = { requestId, done, total }
            event.sender.send(CONSTANTS.ipc.lfsCommandsLockProgress, payload)
        }),
    )

    safeHandle(
        CONSTANTS.ipc.lfsCommandsUnlockPaths,
        (event, dir: string, paths: string[], force: boolean | undefined, requestId: string | null) =>
            unlockPaths(dir, paths, force, (done, total) => {
                if (!requestId || event.sender.isDestroyed()) return
                const payload: LfsLockProgress = { requestId, done, total }
                event.sender.send(CONSTANTS.ipc.lfsCommandsLockProgress, payload)
            }),
    )

    safeHandle(CONSTANTS.ipc.lfsCommandsMigrateLocks, async (_event, dir: string) => {
        const migrations = await migrateLocks(dir)

        // Any migration that actually touched a lock invalidates the cached lock list
        if (migrations.some(m => m.status === "migrated" || m.status === "failed-unlock")) {
            const locks = await listLocks(dir)
            cacheStore.update(cache => {
                cache.lfsLocks[dir] = locks
                return cache
            })
        }

        return migrations
    })
}
