import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { OpenProjectResult, Project } from "@/main/types/projects"
import CONSTANTS from "@/renderer/lib/constants"
import { reportError } from "@/renderer/lib/utils/errors"

/**
 * The type for the project context.
 */
export type ProjectContextType = {
    currentProject: Project | null
    recentProjects: Project[]
    remoteUrl: string | null
    isLoading: boolean
    addLocalProject: () => Promise<void>
    openProject: (dir: string) => Promise<void>
    removeRecentProject: (dir: string) => Promise<void>
    clearRecentProjects: () => Promise<void>
    closeProject: () => void
    openInUnrealEditor: () => Promise<void>
}

/**
 * The `Project` context, providing the currently opened repository and the list
 * of recently opened projects.
 */
export const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

/**
 * The props for the `ProjectProvider` component.
 */
type ProjectProviderProps = {
    children: ReactNode
}

/**
 * Provides the current project and recent projects to the component tree, backed
 * by the `window.api.projects` bridge.
 */
export default function ProjectProvider({ children }: ProjectProviderProps) {
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const [recentProjects, setRecentProjects] = useState<Project[]>([])
    const [remoteUrl, setRemoteUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    /**
     * Refreshes the recent projects list from the store.
     */
    const refreshRecentProjects = useCallback(async () => {
        setRecentProjects(await window.api.projects.getRecent())
    }, [])

    /**
     * Runs an open action, reflecting its outcome in the current project and surfacing any
     * failure through the native error-with-details dialog, and refreshing the recent
     * projects list afterwards.
     * @param action The open action to run (add local or open by path).
     */
    const runOpen = useCallback(
        async (action: () => Promise<OpenProjectResult>) => {
            try {
                const result = await action()

                if (result.ok) {
                    setCurrentProject(result.project)
                } else if (result.reason !== "cancelled") {
                    const message =
                        CONSTANTS.PROJECT_OPEN_FAILURE_MESSAGES[result.reason] ?? "The project couldn't be opened."
                    window.api.dialogs.errorWithDetails(
                        "Can't open project",
                        message,
                        result.message ?? "No further details available.",
                    )
                }

                await refreshRecentProjects()
            } catch (err) {
                const details = err instanceof Error ? err.message : String(err)
                window.api.dialogs.errorWithDetails(
                    "Can't open project",
                    "An unexpected error occurred while opening the project.",
                    details,
                )
            }
        },
        [refreshRecentProjects],
    )

    /**
     * Prompts the user to pick a local folder and opens it as the current project.
     */
    const addLocalProject = useCallback(() => runOpen(() => window.api.projects.addLocal()), [runOpen])

    /**
     * Opens an existing project by path (e.g. from the recent projects list).
     * @param dir The absolute repository path to open.
     */
    const openProject = useCallback((dir: string) => runOpen(() => window.api.projects.open(dir)), [runOpen])

    /**
     * Removes a project from the recent projects list, closing it if it is the
     * currently opened project.
     * @param dir The absolute repository path to forget.
     */
    const removeRecentProject = useCallback(async (dir: string) => {
        setRecentProjects(await window.api.projects.removeRecent(dir))
        setCurrentProject(current => (current?.path === dir ? null : current))
    }, [])

    /**
     * Clears every entry from the recent projects list.
     */
    const clearRecentProjects = useCallback(async () => {
        setRecentProjects(await window.api.projects.clearRecent())
    }, [])

    /**
     * Closes the current project without affecting the recent projects list.
     */
    const closeProject = useCallback(() => setCurrentProject(null), [])

    /**
     * Opens the current project in Unreal Engine, replacing its cached `.uproject`
     * metadata with the copy the main process resolved at launch time.
     */
    const openInUnrealEditor = useCallback(async () => {
        if (!currentProject) return

        try {
            const uproject = await window.api.uproject.open(currentProject.path)

            // Guards against the project being closed or swapped while the editor was launching
            setCurrentProject(current => (current?.path === currentProject.path ? { ...current, uproject } : current))
        } catch (error) {
            reportError("Can't open the project in Unreal Editor", error)
        }
    }, [currentProject])

    // Starts the auto-lock loop whenever a project is open and stops it when
    // there is none, so the periodic reconcile is scoped to the active project
    useEffect(() => {
        if (!currentProject?.path) {
            window.api.autoLock.stop()
            return
        }

        window.api.autoLock.start(currentProject.path)
    }, [currentProject?.path])

    // Fetches the current project's origin URL whenever the open project
    // changes, so downstream consumers (e.g the menu bar) can enable/disable
    // remote-scoped actions accordingly
    useEffect(() => {
        if (!currentProject?.path) {
            setRemoteUrl(null)
            return
        }

        let cancelled = false

        window.api.gitCommands
            .getRemoteUrl(currentProject.path)
            .then(url => {
                if (cancelled) return
                setRemoteUrl(url)
            })
            .catch(() => {
                if (cancelled) return
                setRemoteUrl(null)
            })

        return () => {
            cancelled = true
        }
    }, [currentProject?.path])

    // On mount, load the recent projects and, when configured to do so, re-open
    // the most recently opened project
    useEffect(() => {
        const init = async () => {
            setIsLoading(true)

            try {
                const projects = await window.api.projects.getRecent()

                setRecentProjects(projects)

                if (window.api.preferences.initial.startupBehavior === "reopen-last" && projects[0]) {
                    await openProject(projects[0].path)
                }
            } catch (err) {
                const details = err instanceof Error ? err.message : String(err)
                window.api.dialogs.errorWithDetails(
                    "Failed to load recent projects",
                    "The recent projects list couldn't be loaded on startup.",
                    details,
                )
            }

            setIsLoading(false)
        }

        init()
    }, [openProject])

    return (
        <ProjectContext.Provider
            value={{
                currentProject,
                recentProjects,
                remoteUrl,
                isLoading,
                addLocalProject,
                openProject,
                removeRecentProject,
                clearRecentProjects,
                closeProject,
                openInUnrealEditor,
            }}
        >
            {children}
        </ProjectContext.Provider>
    )
}

/**
 * A custom hook to access the current project and recent projects from the `ProjectContext`.
 * @returns The project context value.
 */
export function useProjectContext() {
    const ctx = useContext(ProjectContext)
    if (ctx === undefined) throw new Error("'useProjectContext' must be used within a 'ProjectProvider'")
    return ctx
}
