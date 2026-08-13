import { ObservableStore } from "@main/lib/stores/observable"
import type { CompileDbState } from "@/main/types/compileDb"

/**
 * Builds the state the compile-database watcher starts from, idle with no project
 * bound yet, filled in when the service is started.
 * @returns The initial compile-database state.
 */
function createInitialState(): CompileDbState {
    return {
        enabled: false,
        dir: null,
        engineRoot: null,
        target: null,
        isRunning: false,
        runningStep: null,
        isFullRegenSuggested: false,
        trackedFileCount: 0,
        lastRunAt: null,
        lastResult: null,
        lastError: null,
    }
}

/**
 * The single app-wide compile-database store, subscribed to by every window so
 * the status chip and the menu items follow the same transitions.
 */
export const compileDbStore = new ObservableStore<CompileDbState>(createInitialState())
