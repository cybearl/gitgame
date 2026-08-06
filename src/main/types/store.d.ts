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
 * The full shape of the persisted application configuration file.
 */
export type AppConfig = {
    version: number
    preferences: AppPreferences
    recentProjects: Project[]
    lfsLockCache: Record<string, LfsLock[]>
}
