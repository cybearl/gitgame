import type { LfsLock } from "@/main/types/lfs"

/**
 * What GitGame should do with the previously opened project when it launches.
 */
export type StartupBehavior = "reopen-last" | "start-clean"

/**
 * A project definition.
 */
export type Project = {
    path: string
    name: string
    lastOpenedAt: string
}

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
 * The full shape of the persisted application configuration file.
 */
export type AppConfig = {
    version: number
    preferences: AppPreferences
    recentProjects: Project[]
    lfsLockCache: Record<string, LfsLock[]>
}
