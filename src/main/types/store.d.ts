import type { LfsLock } from "@/main/types/lfsCommands"
import type { Project } from "@/main/types/projects"

/**
 * What GitGame should do with the previously opened project when it launches.
 */
export type StartupBehavior = "reopen-last" | "start-clean"

/**
 * The user-facing application preferences.
 */
export type AppPreferences = {
    startupBehavior: StartupBehavior
    filesPaneWidth: number
    searchIsRegex: boolean
    isAdvancedSearchOpened: boolean
    searchIncludePatterns: string
    searchExcludePatterns: string
    isShowingMyLocksOnly: boolean
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
 * The size, position and state a window is put back to on the next launch,
 * `bounds` is `null` until the app has been run once.
 */
export type WindowPlacement = {
    bounds: WindowBounds | null
    isMaximized: boolean
    isFullScreen: boolean
}

/**
 * The full shape of the persisted application configuration file.
 */
export type AppConfig = {
    version: number
    preferences: AppPreferences
    windowPlacement: WindowPlacement
    recentProjects: Project[]
    lfsLockCache: Record<string, LfsLock[]>
}
