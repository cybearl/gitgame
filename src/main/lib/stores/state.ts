import DEFAULT_APP_STATE from "@main/config/state"
import STORE_CONFIG from "@main/config/store"
import { JsonStore } from "@main/lib/stores/json"
import type { AppState } from "@/main/types/store"

/**
 * Merges a possibly partial on-disk state with the defaults so the rest of the
 * app can rely on every field being present.
 * @param partial The raw parsed state, which may be missing fields.
 * @returns A complete `AppState`.
 */
function normalizeState(partial: Partial<AppState>): AppState {
    const view = partial.view ?? DEFAULT_APP_STATE.view

    return {
        windowPlacement: {
            ...DEFAULT_APP_STATE.windowPlacement,
            ...(partial.windowPlacement ?? {}),
        },
        recentProjects: Array.isArray(partial.recentProjects) ? partial.recentProjects : [],
        view: {
            filesPaneWidth: view.filesPaneWidth ?? DEFAULT_APP_STATE.view.filesPaneWidth,
            searchIsRegex: view.searchIsRegex ?? DEFAULT_APP_STATE.view.searchIsRegex,
            isAdvancedSearchOpened: view.isAdvancedSearchOpened ?? DEFAULT_APP_STATE.view.isAdvancedSearchOpened,
            searchIncludePatterns: view.searchIncludePatterns ?? DEFAULT_APP_STATE.view.searchIncludePatterns,
            searchExcludePatterns: view.searchExcludePatterns ?? DEFAULT_APP_STATE.view.searchExcludePatterns,
            isShowingMyLocksOnly: view.isShowingMyLocksOnly ?? DEFAULT_APP_STATE.view.isShowingMyLocksOnly,
        },
    }
}

/**
 * The single app-wide state store, holding the window placement, the recent
 * projects and the view state.
 */
export const stateStore = new JsonStore<AppState>({
    fileName: STORE_CONFIG.stateFileName,
    defaults: DEFAULT_APP_STATE,
    normalize: normalizeState,
})
