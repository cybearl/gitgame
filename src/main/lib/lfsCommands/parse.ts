import type { LfsLock } from "@/main/types/lfsCommands"

/**
 * The shape of a single lock entry in `git lfs locks --json` output.
 */
type RawLfsLock = {
    id?: string
    path?: string
    owner?: { name?: string }
    locked_at?: string
}

/**
 * Parses the output of `git lfs locks --json` into structured locks (without the
 * `isMine` flag, which the service fills in from the current user).
 * @param output The raw stdout of the locks command.
 * @returns The parsed locks.
 */
export function parseLocks(output: string): Omit<LfsLock, "isMine">[] {
    const trimmed = output.trim()
    if (!trimmed) return []

    const raw = JSON.parse(trimmed) as unknown
    if (!Array.isArray(raw)) return []

    return (raw as RawLfsLock[]).map(lock => ({
        id: lock.id ?? "",
        path: lock.path ?? "",
        owner: lock.owner?.name ?? "",
        lockedAt: lock.locked_at ?? "",
    }))
}

/**
 * Parses the output of `git check-attr -z lockable -- <files>` into the list of
 * paths whose `lockable` attribute is set.
 *
 * Note: The `-z` output is a flat stream of NUL-separated tokens grouped in triples of
 * `(path, attribute, value)`.
 * @param output The raw stdout of the check-attr command.
 * @returns The paths that are lockable.
 */
export function parseLockablePaths(output: string): string[] {
    const tokens = output.split("\0")
    const paths: string[] = []

    for (let i = 0; i + 2 < tokens.length; i += 3) {
        if (tokens[i + 2] === "set") paths.push(tokens[i])
    }

    return paths
}
