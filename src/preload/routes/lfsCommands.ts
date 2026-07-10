import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const lfsCommandsApiRoutes: GitgameApi["lfsCommands"] = {
    listLocks: dir => ipcRenderer.invoke(CONSTANTS.ipc.lfsCommandsListLocks, dir),
    getCachedLocks: dir => ipcRenderer.invoke(CONSTANTS.ipc.lfsCommandsGetCachedLocks, dir),
    getLockableFiles: dir => ipcRenderer.invoke(CONSTANTS.ipc.lfsCommandsGetLockableFiles, dir),
    lockPaths: (dir, paths) => ipcRenderer.invoke(CONSTANTS.ipc.lfsCommandsLockPaths, dir, paths),
    unlockPaths: (dir, paths, force) => ipcRenderer.invoke(CONSTANTS.ipc.lfsCommandsUnlockPaths, dir, paths, force),
}

export default lfsCommandsApiRoutes
