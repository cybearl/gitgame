import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { getLockableFiles, listLocks, lockPaths, migrateLocks, unlockPaths } from "@main/lib/lfsCommands/service"
import { getConfig, updateConfig } from "@main/lib/store"
import type { LfsLockProgress } from "@/main/types/lfsCommands"

/**
 * Registers the IPC handlers for the Git LFS locking service.
 */
export function registerLfsCommandsHandlers() {
    safeHandle(CONSTANTS.ipc.lfsCommandsListLocks, async (_event, dir: string) => {
        const locks = await listLocks(dir)

        updateConfig(config => {
            config.lfsLockCache[dir] = locks
            return config
        })

        return locks
    })

    safeHandle(CONSTANTS.ipc.lfsCommandsGetCachedLocks, async (_event, dir: string) => {
        const config = await getConfig()
        return config.lfsLockCache[dir] ?? []
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
            updateConfig(config => {
                config.lfsLockCache[dir] = locks
                return config
            })
        }

        return migrations
    })
}
