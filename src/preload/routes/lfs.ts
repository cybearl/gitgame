import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The API surface for Git LFS locking operations.
 */
const lfsApiRoutes: GitgameApi["lfs"] = {
    listLocks: dir => ipcRenderer.invoke(CONSTANTS.ipc.lfsListLocks, dir),
    getLockableFiles: dir => ipcRenderer.invoke(CONSTANTS.ipc.lfsGetLockableFiles, dir),
    lockPaths: (dir, paths) => ipcRenderer.invoke(CONSTANTS.ipc.lfsLockPaths, dir, paths),
    unlockPaths: (dir, paths, force) => ipcRenderer.invoke(CONSTANTS.ipc.lfsUnlockPaths, dir, paths, force),
}

export default lfsApiRoutes
