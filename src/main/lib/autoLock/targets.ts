import { resolveAssetDiskPath, resolveLevelDiskPath } from "@main/lib/autoLock/paths"
import { getStatus } from "@main/lib/gitCommands/service"
import { filterLockable } from "@main/lib/lfsCommands/service"
import type { EditorActivity } from "@/main/types/mcp"

/**
 * Pulls the LFS-lockable subset of files currently modified in the working
 * tree, catches on-disk changes the MCP does not see (OFPA external actors
 * once UE has saved them, plus anything already saved and staged).
 * @param dir A path inside the repository.
 * @returns The repo-relative paths of dirty, lockable files.
 */
async function collectDirtyLockableFromGit(dir: string): Promise<string[]> {
    const status = await getStatus(dir)
    const changed = status.changes
        .filter(change => !change.isUntracked && !change.isConflicted)
        .map(change => change.path)

    if (changed.length === 0) return []

    return filterLockable(dir, changed)
}

/**
 * Builds the set of repo-relative disk paths that should be locked, merges the
 * MCP editor activity (current level, dirty asset editor tabs) with what git
 * already sees as modified in the working tree.
 * @param activity The editor activity snapshot from the MCP.
 * @param dir A path inside the repository, used to read the working tree.
 * @returns The set of disk paths that should be under an active LFS lock.
 */
export async function collectAutoLockTargets(activity: EditorActivity, dir: string): Promise<Set<string>> {
    const targets = new Set<string>()

    if (activity.currentLevel) {
        const levelDiskPath = resolveLevelDiskPath(activity.currentLevel)
        if (levelDiskPath) targets.add(levelDiskPath)
    }

    for (const assetPath of activity.dirtyAssets) {
        const assetDiskPath = resolveAssetDiskPath(assetPath)
        if (assetDiskPath) targets.add(assetDiskPath)
    }

    for (const filePath of await collectDirtyLockableFromGit(dir)) {
        targets.add(filePath)
    }

    return targets
}
