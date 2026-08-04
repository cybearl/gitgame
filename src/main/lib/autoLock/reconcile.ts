import { collectAutoLockTargets } from "@main/lib/autoLock/targets"
import { listLocks, lockPaths, unlockPaths } from "@main/lib/lfsCommands/service"
import { getEditorActivity } from "@main/lib/mcp/tools"
import type { AutoLockReconcileResult } from "@/main/types/autoLock"

/**
 * Splits the target set against the paths we already hold locks on into the
 * lock and unlock deltas, targets not yet locked go into `toLock` and locks
 * whose file is no longer a target go into `toUnlock`.
 * @param targets The disk paths the current activity says should be locked.
 * @param mineLocked The disk paths we already own an LFS lock for.
 * @returns The delta sets to apply.
 */
function diffLockSets(targets: Set<string>, mineLocked: Set<string>): { toLock: string[]; toUnlock: string[] } {
    const toLock: string[] = []
    for (const path of targets) {
        if (!mineLocked.has(path)) toLock.push(path)
    }

    const toUnlock: string[] = []
    for (const path of mineLocked) {
        if (!targets.has(path)) toUnlock.push(path)
    }

    return { toLock, toUnlock }
}

/**
 * Runs a single auto-lock reconcile pass: reads the editor activity, builds
 * the target set, diffs it against the caller's existing LFS locks, then locks
 * the new targets and unlocks anything that is no longer in the set.
 * @param dir A path inside the repository.
 * @returns The target set, and the results of both the lock and unlock calls.
 */
export async function reconcileAutoLock(dir: string): Promise<AutoLockReconcileResult> {
    const activity = await getEditorActivity()
    const targets = await collectAutoLockTargets(activity, dir)

    const allLocks = await listLocks(dir)
    const mineLocked = new Set(allLocks.filter(lock => lock.isMine).map(lock => lock.path))

    const { toLock, toUnlock } = diffLockSets(targets, mineLocked)

    const [locked, unlocked] = await Promise.all([
        toLock.length > 0 ? lockPaths(dir, toLock) : Promise.resolve([]),
        toUnlock.length > 0 ? unlockPaths(dir, toUnlock) : Promise.resolve([]),
    ])

    return {
        targets: [...targets],
        locked,
        unlocked,
    }
}
