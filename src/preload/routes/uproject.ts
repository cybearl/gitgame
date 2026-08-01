import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import type { UProject } from "@/main/types/uproject"

const uprojectApiRoutes: GitgameApi["uproject"] = {
    open: dir => safeInvoke<UProject>(CONSTANTS.ipc.uprojectOpen, dir),
}

export default uprojectApiRoutes
