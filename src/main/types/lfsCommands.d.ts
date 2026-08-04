/**
 * A single Git LFS lock.
 */
export type LfsLock = {
    id: string
    path: string
    owner: string
    lockedAt: string
    isMine: boolean
}

/**
 * The outcome of a lock or unlock operation on a single file.
 */
export type LfsLockResult = {
    path: string
    ok: boolean
    error?: string
}

/**
 * The payload streamed over the LFS lock progress channel, carrying a live
 * `done/total` count, scoped by `requestId` so concurrent batches stay isolated.
 */
export type LfsLockProgress = {
    requestId: string
    done: number
    total: number
}

/**
 * The outcome of a lock migration for a single staged rename, describing how
 * the old path's lock was carried over to the new path.
 */
export type LfsLockMigration = {
    from: string
    to: string
    /**
     * The migration status, `migrated` on success, `skipped-*` when the migration
     * did not apply, `failed-*` when a step errored, self-describing suffixes.
     */
    status:
        | "migrated"
        | "skipped-not-locked"
        | "skipped-not-mine"
        | "skipped-not-lockable"
        | "failed-lock"
        | "failed-unlock"
    error?: string
}
