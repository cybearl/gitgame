import CONSTANTS from "@main/lib/constants"
import { getLockableFiles, listLocks, lockPaths, unlockPaths } from "@main/lib/lfsCommands/service"
import { getConfig, updateConfig } from "@main/lib/store"
import { ipcMain } from "electron"

/**
 * Registers the IPC handlers that expose the Git LFS locking service to the
 * renderer process.
 */
export function registerLfsCommandsHandlers() {
    ipcMain.handle(CONSTANTS.ipc.lfsCommandsListLocks, async (_event, dir: string) => {
        const locks = await listLocks(dir)

        updateConfig(config => {
            config.lfsLockCache[dir] = locks
            return config
        })

        return locks
    })

    ipcMain.handle(CONSTANTS.ipc.lfsCommandsGetCachedLocks, async (_event, dir: string) => {
        const config = await getConfig()
        return config.lfsLockCache[dir] ?? []
    })

    ipcMain.handle(CONSTANTS.ipc.lfsCommandsGetLockableFiles, (_event, dir: string) => getLockableFiles(dir))

    ipcMain.handle(CONSTANTS.ipc.lfsCommandsLockPaths, (_event, dir: string, paths: string[]) => lockPaths(dir, paths))

    ipcMain.handle(CONSTANTS.ipc.lfsCommandsUnlockPaths, (_event, dir: string, paths: string[], force?: boolean) =>
        unlockPaths(dir, paths, force),
    )
}
