import CONSTANTS from "@main/lib/constants"
import { getLockableFiles, listLocks, lockPaths, unlockPaths } from "@main/lib/lfs/service"
import { ipcMain } from "electron"

/**
 * Registers the IPC handlers that expose the Git LFS locking service to the
 * renderer process.
 *
 * Thrown errors propagate so the corresponding `ipcRenderer.invoke` call rejects
 * with the error message on the renderer side.
 */
export function registerLfsHandlers() {
    ipcMain.handle(CONSTANTS.ipc.lfsListLocks, (_event, dir: string) => listLocks(dir))
    ipcMain.handle(CONSTANTS.ipc.lfsGetLockableFiles, (_event, dir: string) => getLockableFiles(dir))
    ipcMain.handle(CONSTANTS.ipc.lfsLockPaths, (_event, dir: string, paths: string[]) => lockPaths(dir, paths))
    ipcMain.handle(CONSTANTS.ipc.lfsUnlockPaths, (_event, dir: string, paths: string[], force?: boolean) =>
        unlockPaths(dir, paths, force),
    )
}
