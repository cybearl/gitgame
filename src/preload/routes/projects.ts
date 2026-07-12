import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import type { OpenProjectResult, Project } from "@/main/types/projects"
import type { AppPreferences } from "@/main/types/store"

const projectsApiRoutes: GitgameApi["projects"] = {
    addLocal: () => safeInvoke<OpenProjectResult>(CONSTANTS.ipc.projectsAddLocal),
    open: dir => safeInvoke<OpenProjectResult>(CONSTANTS.ipc.projectsOpen, dir),
    getRecent: () => safeInvoke<Project[]>(CONSTANTS.ipc.projectsGetRecent),
    removeRecent: dir => safeInvoke<Project[]>(CONSTANTS.ipc.projectsRemoveRecent, dir),
    clearRecent: () => safeInvoke<Project[]>(CONSTANTS.ipc.projectsClearRecent),
    getPreferences: () => safeInvoke<AppPreferences>(CONSTANTS.ipc.projectsGetPreferences),
    setPreferences: preferences => safeInvoke<AppPreferences>(CONSTANTS.ipc.projectsSetPreferences, preferences),
}

export default projectsApiRoutes
