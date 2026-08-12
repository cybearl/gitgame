import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import type { AppViewState } from "@/main/types/store"

const viewStateApiRoutes: GitgameApi["viewState"] = {
    get: () => safeInvoke<AppViewState>(CONSTANTS.ipc.viewStateGet),
    set: view => safeInvoke<AppViewState>(CONSTANTS.ipc.viewStateSet, view),
}

export default viewStateApiRoutes
