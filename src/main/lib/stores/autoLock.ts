import AUTO_LOCK_CONFIG from "@main/config/autoLock"
import { ObservableStore } from "@main/lib/stores/observable"
import type { AutoLockState } from "@/main/types/autoLock"

/**
 * Builds the state the auto-lock loop starts from, disabled with no project
 * bound yet, filled in when the service is started.
 * @returns The initial auto-lock state.
 */
function createInitialState(): AutoLockState {
    return {
        enabled: false,
        dir: null,
        isReconciling: false,
        lastReconciledAt: null,
        lockedCount: 0,
        failures: [],
        lastError: null,
        tickIntervalMs: AUTO_LOCK_CONFIG.tickIntervalMs,
    }
}

/**
 * The single app-wide auto-lock store, subscribed to by every window so the
 * status chip and any manual controls follow the same transitions.
 */
export const autoLockStore = new ObservableStore<AutoLockState>(createInitialState())
