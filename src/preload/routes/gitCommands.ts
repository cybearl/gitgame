import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const gitCommandsApiRoutes: GitgameApi["gitCommands"] = {
    isRepository: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitCommandsIsRepository, dir),
    getRepositoryRoot: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitCommandsGetRepositoryRoot, dir),
    getStatus: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitCommandsGetStatus, dir),
    listBranches: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitCommandsListBranches, dir),
    getLog: (dir, limit) => ipcRenderer.invoke(CONSTANTS.ipc.gitCommandsGetLog, dir, limit),
    getRemoteUrl: dir => ipcRenderer.invoke(CONSTANTS.ipc.gitCommandsGetRemoteUrl, dir),
}

export default gitCommandsApiRoutes
