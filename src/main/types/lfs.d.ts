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
