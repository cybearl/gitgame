import type { LfsLock } from "@/main/types/lfsCommands"
import type { Project } from "@/main/types/projects"

/**
 * What GitGame should do with the previously opened project when it launches.
 */
export type StartupBehavior = "reopen-last" | "start-clean"

/**
 * The user-authored settings.
 */
export type AppPreferences = {
    theme: string
    startupBehavior: StartupBehavior
    autoLockTickIntervalMs: number
    mcpEndpoint: string
    mcpProbeIntervalMs: number
    isCompileDbAutoRegenEnabled: boolean
    compileDbDebounceMs: number
    unrealEngineRoot: string
    isAutomaticUpdateCheckEnabled: boolean
    updaterCheckIntervalMs: number
}

/**
 * The full shape of the persisted application configuration file.
 */
export type AppConfig = {
    version: number
    preferences: AppPreferences
}

/**
 * The size and position of a window on screen, in pixels.
 */
export type WindowBounds = {
    x: number
    y: number
    width: number
    height: number
}

/**
 * The size, position and state a window is put back to on the next launch.
 *
 * Note: `bounds` is `null` until the app has been run once.
 */
export type WindowPlacement = {
    bounds: WindowBounds | null
    isMaximized: boolean
    isFullScreen: boolean
}

/**
 * The view state the app writes on its own as the user works.
 */
export type AppViewState = {
    filesPaneWidth: number
    searchIsRegex: boolean
    isAdvancedSearchOpened: boolean
    searchIncludePatterns: string
    searchExcludePatterns: string
    isShowingMyLocksOnly: boolean
}

/**
 * The full shape of the persisted application state file.
 */
export type AppState = {
    windowPlacement: WindowPlacement
    recentProjects: Project[]
    view: AppViewState
}

/**
 * The full shape of the persisted cache file.
 */
export type AppCache = {
    lfsLocks: Record<string, LfsLock[]>
}
