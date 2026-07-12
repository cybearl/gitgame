import { buildFileTree } from "@main/lib/fileTree/build"
import { runGit } from "@main/lib/gitCommands/exec"
import { filterLockable } from "@main/lib/lfsCommands/service"
import type { FileTreeNode } from "@/main/types/fileTree"

/**
 * Builds the repository file tree, annotating each node with its `lockable` state.
 * @param dir A path inside the repository.
 * @returns The root-level file tree nodes.
 * @throws If listing the repository files fails.
 */
export async function getFileTree(dir: string): Promise<FileTreeNode[]> {
    const listed = await runGit(["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: dir })
    if (listed.exitCode !== 0) {
        throw new Error(listed.stderr.trim() || "Failed to list repository files.")
    }

    const deleted = await runGit(["ls-files", "--deleted", "-z"], { cwd: dir })
    if (deleted.exitCode !== 0) {
        throw new Error(deleted.stderr.trim() || "Failed to list deleted repository files.")
    }

    const deletedSet = new Set(deleted.stdout.split("\0").filter(Boolean))

    const files = [...new Set(listed.stdout.split("\0").filter(Boolean))].filter(file => !deletedSet.has(file))
    if (files.length === 0) return []

    const lockable = new Set(await filterLockable(dir, files))

    return buildFileTree(files, lockable)
}
