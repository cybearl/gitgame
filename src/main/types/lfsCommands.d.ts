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
 * The outcome of a lock migration for a single staged rename, describing how
 * the old path's lock was carried over to the new path.
 */
export type LfsLockMigration = {
    from: string
    to: string
    /**
     * The migration status, one of:
     * - `migrated`: The old lock belonged to the current user, the new path was
     * locked and the old lock released
     * - `skipped-not-locked`: The old path had no active lock, nothing to do
     * - `skipped-not-mine`: The old path is locked by another user and cannot
     * be transferred without a force-unlock
     * - `skipped-not-lockable`: The new path is not covered by the `lockable`
     * attribute, so it cannot receive the lock
     * - `failed-lock`: Locking the new path failed, the old lock was preserved
     * - `failed-unlock`: The new path was locked but the old lock could not be
     * released, both locks currently exist
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
