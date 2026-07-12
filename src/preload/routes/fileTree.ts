import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import type { FileTreeNode } from "@/main/types/fileTree"

const fileTreeApiRoutes: GitgameApi["fileTree"] = {
    get: dir => safeInvoke<FileTreeNode[]>(CONSTANTS.ipc.fileTreeGet, dir),
}

export default fileTreeApiRoutes
