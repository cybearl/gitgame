import type { AppState } from "@/main/types/store"

/**
 * The default state used when no state file exists yet, or when the existing one
 * is missing fields.
 */
const DEFAULT_APP_STATE: AppState = {
    windowPlacement: {
        bounds: null,
        isMaximized: false,
        isFullScreen: false,
    },
    recentProjects: [],
    view: {
        filesPaneWidth: 320,
        searchIsRegex: false,
        isAdvancedSearchOpened: false,
        searchIncludePatterns: "",
        searchExcludePatterns: "",
        isShowingMyLocksOnly: false,
    },
}

export default DEFAULT_APP_STATE
