import type { LfsLockResult } from "@/main/types/lfsCommands"

/**
 * The outcome of a single auto-lock reconcile pass, carries the target set the
 * pass computed together with the lock and unlock results, so the renderer can
 * surface the diff even when nothing changed.
 */
export type AutoLockReconcileResult = {
    targets: string[]
    locked: LfsLockResult[]
    unlocked: LfsLockResult[]
}

/**
 * The auto-lock loop's observable state, broadcast to every open window so the
 * status chip and any manual controls can follow the same transitions the
 * background loop records.
 */
export type AutoLockState = {
    enabled: boolean
    dir: string | null
    isReconciling: boolean
    lastReconciledAt: string | null
    lockedCount: number
    failures: LfsLockResult[]
    lastError: string | null
    tickIntervalMs: number
}
