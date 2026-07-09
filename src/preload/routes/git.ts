import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The API surface for read-only Git operations.
 *
 * Every call targets a repository by path, so the renderer is not required to
 * hold a notion of a "current" working directory in the main process.
 */
const gitApiRoutes: GitgameApi["git"] = {
    isRepository: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitIsRepository, dir),
    getRepositoryRoot: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitGetRepositoryRoot, dir),
    getStatus: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitGetStatus, dir),
    listBranches: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitListBranches, dir),
    getLog: (dir, limit) => ipcRenderer.invoke(CONSTANTS.ipc.gitGetLog, dir, limit),
    getRemoteUrl: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitGetRemoteUrl, dir),
}

export default gitApiRoutes
