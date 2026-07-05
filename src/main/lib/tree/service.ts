import { runGit } from "@main/lib/git/exec"
import { filterLockable } from "@main/lib/lfs/service"
import { buildFileTree } from "@main/lib/tree/build"
import type { FileTreeNode } from "@/main/types/tree"

/**
 * Builds the repository file tree, annotating each node with its `lockable`
 * state. Lock ownership is intentionally left out: it is dynamic and overlaid
 * separately by the renderer from `listLocks`.
 * @param dir A path inside the repository.
 * @returns The root-level file tree nodes.
 * @throws If listing the repository files fails.
 */
export async function getFileTree(dir: string): Promise<FileTreeNode[]> {
    const listed = await runGit(["ls-files", "-z"], { cwd: dir })
    if (listed.exitCode !== 0) {
        throw new Error(listed.stderr.trim() || "Failed to list repository files.")
    }

    const files = listed.stdout.split("\0").filter(Boolean)
    if (files.length === 0) return []

    const lockable = new Set(await filterLockable(dir, files))

    return buildFileTree(files, lockable)
}
