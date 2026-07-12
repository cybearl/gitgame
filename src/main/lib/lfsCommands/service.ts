import { runGit } from "@main/lib/gitCommands/exec"
import { getStatus } from "@main/lib/gitCommands/service"
import { parseLockablePaths, parseLocks } from "@main/lib/lfsCommands/parse"
import GIT_CONFIG from "@/main/config/git"
import type { LfsLock, LfsLockMigration, LfsLockResult } from "@/main/types/lfsCommands"

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
 * Locks every lockable file covered by the given paths, in parallel, reporting
 * per-file completion through the optional `onProgress` callback so a caller
 * can render a live progress bar.
 * @param dir A path inside the repository.
 * @param paths The repository-relative paths to lock (files or folders).
 * @param onProgress Called once with `(0, total)` after expansion, then again
 * as each per-file command settles, until `done === total`.
 * @returns The per-file results.
 */
export async function lockPaths(
    dir: string,
    paths: string[],
    onProgress?: (done: number, total: number) => void,
): Promise<LfsLockResult[]> {
    const files = await expandToLockableFiles(dir, paths)
    const total = files.length

    onProgress?.(0, total)

    let done = 0
    return Promise.all(
        files.map(async file => {
            const result = await runLockCommand(dir, ["lfs", "lock", file], file)
            done += 1
            onProgress?.(done, total)
            return result
        }),
    )
}

/**
 * Unlocks every lockable file covered by the given paths, in parallel, reporting
 * per-file completion through the optional `onProgress` callback so a caller
 * can render a live progress bar.
 * @param dir A path inside the repository.
 * @param paths The repository-relative paths to unlock (files or folders).
 * @param force Whether to force-unlock files locked by other users.
 * @param onProgress Called once with `(0, total)` after expansion, then again
 * as each per-file command settles, until `done === total`.
 * @returns The per-file results.
 */
export async function unlockPaths(
    dir: string,
    paths: string[],
    force = false,
    onProgress?: (done: number, total: number) => void,
): Promise<LfsLockResult[]> {
    const files = await expandToLockableFiles(dir, paths)
    const total = files.length

    onProgress?.(0, total)

    let done = 0
    return Promise.all(
        files.map(async file => {
            const args = force ? ["lfs", "unlock", "--force", file] : ["lfs", "unlock", file]
            const result = await runLockCommand(dir, args, file)
            done += 1
            onProgress?.(done, total)
            return result
        }),
    )
}

/**
 * Migrates the LFS lock of a single staged rename from the old path to the new
 * one: locks the new path first so a failure preserves the existing lock, then
 * unlocks the old path only if the new lock succeeded.
 * @param dir A path inside the repository.
 * @param from The old repository-relative path (source of the rename).
 * @param to The new repository-relative path (target of the rename).
 * @param oldLock The active lock on `from`, or `undefined` if none.
 * @param lockable Whether the new path carries the `lockable` attribute.
 * @returns The migration outcome for this rename.
 */
async function migrateOneLock(
    dir: string,
    from: string,
    to: string,
    oldLock: LfsLock | undefined,
    lockable: boolean,
): Promise<LfsLockMigration> {
    if (!oldLock) {
        return {
            from,
            to,
            status: "skipped-not-locked",
        }
    }

    if (!oldLock.isMine) {
        return {
            from,
            to,
            status: "skipped-not-mine",
        }
    }

    if (!lockable) {
        return {
            from,
            to,
            status: "skipped-not-lockable",
        }
    }

    const lockResult = await runGit(["lfs", "lock", to], { cwd: dir })
    if (lockResult.exitCode !== 0) {
        return {
            from,
            to,
            status: "failed-lock",
            error: lockResult.stderr.trim() || undefined,
        }
    }

    const unlockResult = await runGit(["lfs", "unlock", from], { cwd: dir })
    if (unlockResult.exitCode !== 0) {
        return {
            from,
            to,
            status: "failed-unlock",
            error: unlockResult.stderr.trim() || undefined,
        }
    }

    return {
        from,
        to,
        status: "migrated",
    }
}

/**
 * Carries LFS locks across staged renames so a locked file keeps its lock
 * under its new name. Only locks owned by the current user are migrated, locks
 * held by teammates are reported back untouched.
 * @param dir A path inside the repository.
 * @returns One entry per detected staged rename, describing the migration outcome.
 * @throws If reading the status or the locks fails.
 */
export async function migrateLocks(dir: string): Promise<LfsLockMigration[]> {
    const status = await getStatus(dir)

    // Filter for renamed files
    const renames = status.changes.filter(
        (change): change is typeof change & { renamedFrom: string } => typeof change.renamedFrom === "string",
    )

    if (renames.length === 0) return []

    const locks = await listLocks(dir)
    const locksByPath = new Map(locks.map(lock => [lock.path, lock]))

    const lockable = new Set(
        await filterLockable(
            dir,
            renames.map(change => change.path),
        ),
    )

    const results: LfsLockMigration[] = []
    for (const change of renames) {
        results.push(
            await migrateOneLock(
                dir,
                change.renamedFrom,
                change.path,
                locksByPath.get(change.renamedFrom),
                lockable.has(change.path),
            ),
        )
    }

    return results
}
