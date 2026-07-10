import { runGit } from "@main/lib/gitCommands/exec"
import { parseLockablePaths, parseLocks } from "@main/lib/lfsCommands/parse"
import GIT_CONFIG from "@/main/config/git"
import type { LfsLock, LfsLockResult } from "@/main/types/lfsCommands"

/**
 * Reads the configured Git user name, used to tell apart locks owned by the
 * current user from those held by teammates.
 * @param dir A path inside the repository.
 * @returns The user name, or `null` if it is not configured.
 */
export async function getCurrentUser(dir: string): Promise<string | null> {
    const result = await runGit(["config", "user.name"], { cwd: dir })
    const name = result.stdout.trim()

    return result.exitCode === 0 && name ? name : null
}

/**
 * Lists the active Git LFS locks, flagging those owned by the current user.
 * @param dir A path inside the repository.
 * @returns The parsed locks.
 * @throws If the locks command fails.
 */
export async function listLocks(dir: string): Promise<LfsLock[]> {
    const result = await runGit(["lfs", "locks", "--json"], { cwd: dir })
    if (result.exitCode !== 0) {
        throw new Error(result.stderr.trim() || "Failed to list LFS locks.")
    }

    const currentUser = await getCurrentUser(dir)

    return parseLocks(result.stdout).map(lock => ({
        ...lock,
        isMine: currentUser !== null && lock.owner === currentUser,
    }))
}

/**
 * Filters a list of repository-relative paths down to those whose `lockable` Git
 * attribute is set, batching the attribute lookups to stay under the OS
 * command-line length limit.
 * @param dir A path inside the repository.
 * @param files The repository-relative paths to check.
 * @returns The subset of paths that are lockable.
 * @throws If reading the attributes fails.
 */
export async function filterLockable(dir: string, files: string[]): Promise<string[]> {
    if (files.length === 0) return []

    const lockable: string[] = []

    for (let i = 0; i < files.length; i += GIT_CONFIG.checkAttributeChunkSize) {
        const chunk = files.slice(i, i + GIT_CONFIG.checkAttributeChunkSize)

        const attributes = await runGit(["check-attr", "-z", "lockable", "--", ...chunk], { cwd: dir })
        if (attributes.exitCode !== 0) {
            throw new Error(attributes.stderr.trim() || "Failed to read lockable attributes.")
        }

        lockable.push(...parseLockablePaths(attributes.stdout))
    }

    return lockable
}

/**
 * Lists the repository files whose `lockable` Git attribute is set.
 * @param dir A path inside the repository.
 * @returns The lockable file paths, repository-relative.
 * @throws If listing the files or reading their attributes fails.
 */
export async function getLockableFiles(dir: string): Promise<string[]> {
    const listed = await runGit(["ls-files", "-z"], { cwd: dir })
    if (listed.exitCode !== 0) {
        throw new Error(listed.stderr.trim() || "Failed to list repository files.")
    }

    return filterLockable(dir, listed.stdout.split("\0").filter(Boolean))
}

/**
 * Expands the given paths into the set of lockable files they cover: a lockable
 * file maps to itself, and a folder maps to every lockable file beneath it.
 * @param dir A path inside the repository.
 * @param paths The repository-relative paths to expand (files or folders).
 * @returns The de-duplicated lockable files covered by the paths.
 */
async function expandToLockableFiles(dir: string, paths: string[]): Promise<string[]> {
    const lockable = await getLockableFiles(dir)
    const lockableSet = new Set(lockable)
    const expanded = new Set<string>()

    for (const input of paths) {
        if (lockableSet.has(input)) {
            expanded.add(input)
            continue
        }

        const prefix = input.endsWith("/") ? input : `${input}/`
        for (const file of lockable) {
            if (file.startsWith(prefix)) expanded.add(file)
        }
    }

    return [...expanded]
}

/**
 * Runs a single lock/unlock command and maps it to a result.
 * @param dir A path inside the repository.
 * @param args The `git` arguments to run.
 * @param file The file the command targets.
 * @returns The per-file result.
 */
async function runLockCommand(dir: string, args: string[], file: string): Promise<LfsLockResult> {
    const result = await runGit(args, { cwd: dir })
    if (result.exitCode === 0) return { path: file, ok: true }

    return {
        path: file,
        ok: false,
        error: result.stderr.trim() || undefined,
    }
}

/**
 * Locks every lockable file covered by the given paths, in parallel.
 * @param dir A path inside the repository.
 * @param paths The repository-relative paths to lock (files or folders).
 * @returns The per-file results.
 */
export async function lockPaths(dir: string, paths: string[]): Promise<LfsLockResult[]> {
    const files = await expandToLockableFiles(dir, paths)
    return Promise.all(files.map(file => runLockCommand(dir, ["lfs", "lock", file], file)))
}

/**
 * Unlocks every lockable file covered by the given paths, in parallel.
 * @param dir A path inside the repository.
 * @param paths The repository-relative paths to unlock (files or folders).
 * @param force Whether to force-unlock files locked by other users.
 * @returns The per-file results.
 */
export async function unlockPaths(dir: string, paths: string[], force = false): Promise<LfsLockResult[]> {
    const files = await expandToLockableFiles(dir, paths)

    return Promise.all(
        files.map(file => {
            const args = force ? ["lfs", "unlock", "--force", file] : ["lfs", "unlock", file]
            return runLockCommand(dir, args, file)
        }),
    )
}
