import dedent from "dedent"
import type { AutoLockState } from "@/main/types/autoLock"
import type { LfsLockResult } from "@/main/types/lfsCommands"

/**
 * Builds the short label shown in the status bar chip, mirrors the MCP chip's
 * naming so the two read as a pair, includes the failure count only when
 * there is something worth surfacing.
 * @param state The current auto-lock state.
 * @returns The chip label.
 */
export function buildAutoLockLabel(state: AutoLockState): string {
    if (state.failures.length > 0) return `${state.lockedCount} held, ${state.failures.length} err`
    return `${state.lockedCount} held`
}

/**
 * Builds the tooltip shown on hover, carries the last reconcile time and the
 * most recent error message so a stuck loop can be diagnosed without opening
 * DevTools.
 * @param state The current auto-lock state.
 * @returns The tooltip text.
 */
export function buildAutoLockTooltip(state: AutoLockState): string {
    if (state.lastError) {
        return dedent`
            Auto-lock error: ${state.lastError}
            Click to reconcile now
        `
    }

    if (!state.lastReconciledAt) {
        return dedent`
            Auto-lock: waiting for the first reconcile...
            Click to reconcile now
        `
    }

    const lastReconciled = new Date(state.lastReconciledAt).toLocaleTimeString()
    return dedent`
        Auto-lock: ${state.lockedCount} file(s) held
        Last reconcile at ${lastReconciled}
        Click to reconcile now
    `
}

/**
 * Builds the details block shown in the failures dialog, one entry per failed
 * lock or unlock, path followed by the raw error message underneath.
 * @param failures The per-file failure records from the last reconcile.
 * @returns The formatted details block.
 */
export function buildAutoLockFailuresDetails(failures: LfsLockResult[]): string {
    return failures
        .map(
            failure =>
                dedent`
                ${failure.path}
                  ${failure.error ?? "Unknown error"}
            `,
        )
        .join("\n\n")
}

/**
 * Computes the fill percentage (0-100) of the countdown bar, based on the
 * time elapsed since the last reconcile as a fraction of the tick interval.
 * @param state The current auto-lock state.
 * @param now The current epoch time in ms, sampled by the chip's tick.
 * @returns The bar fill percentage, `0` before the first reconcile lands.
 */
export function computeAutoLockProgress(state: AutoLockState, now: number): number {
    if (!state.lastReconciledAt) return 0

    const elapsed = now - new Date(state.lastReconciledAt).getTime()
    const fraction = elapsed / state.tickIntervalMs

    return Math.min(100, Math.max(0, fraction * 100))
}
