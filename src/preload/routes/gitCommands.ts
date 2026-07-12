import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import type { GitBranch, GitCommit, GitStatus } from "@/main/types/gitCommands"

const gitCommandsApiRoutes: GitgameApi["gitCommands"] = {
    isRepository: dir => safeInvoke<boolean>(CONSTANTS.ipc.gitCommandsIsRepository, dir),
    getRepositoryRoot: dir => safeInvoke<string>(CONSTANTS.ipc.gitCommandsGetRepositoryRoot, dir),
    getStatus: dir => safeInvoke<GitStatus>(CONSTANTS.ipc.gitCommandsGetStatus, dir),
    listBranches: dir => safeInvoke<GitBranch[]>(CONSTANTS.ipc.gitCommandsListBranches, dir),
    getLog: (dir, limit) => safeInvoke<GitCommit[]>(CONSTANTS.ipc.gitCommandsGetLog, dir, limit),
    getRemoteUrl: dir => safeInvoke<string | null>(CONSTANTS.ipc.gitCommandsGetRemoteUrl, dir),
}

export default gitCommandsApiRoutes
