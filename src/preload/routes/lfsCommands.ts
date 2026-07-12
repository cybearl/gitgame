import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import { withLockProgress } from "@preload/lib/lockProgress"
import type { LfsLock, LfsLockMigration, LfsLockResult } from "@/main/types/lfsCommands"

const lfsCommandsApiRoutes: GitgameApi["lfsCommands"] = {
    listLocks: dir => safeInvoke<LfsLock[]>(CONSTANTS.ipc.lfsCommandsListLocks, dir),
    getCachedLocks: dir => safeInvoke<LfsLock[]>(CONSTANTS.ipc.lfsCommandsGetCachedLocks, dir),
    getLockableFiles: dir => safeInvoke<string[]>(CONSTANTS.ipc.lfsCommandsGetLockableFiles, dir),
    lockPaths: (dir, paths, onProgress) =>
        withLockProgress(onProgress, requestId =>
            safeInvoke<LfsLockResult[]>(CONSTANTS.ipc.lfsCommandsLockPaths, dir, paths, requestId),
        ),
    unlockPaths: (dir, paths, force, onProgress) =>
        withLockProgress(onProgress, requestId =>
            safeInvoke<LfsLockResult[]>(CONSTANTS.ipc.lfsCommandsUnlockPaths, dir, paths, force, requestId),
        ),
    migrateLocks: dir => safeInvoke<LfsLockMigration[]>(CONSTANTS.ipc.lfsCommandsMigrateLocks, dir),
}

export default lfsCommandsApiRoutes
