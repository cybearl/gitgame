import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { OpenProjectResult } from "@/main/types/project"
import type { Project } from "@/main/types/store"

/**
 * The type for the project context.
 */
export type ProjectContextType = {
    currentProject: Project | null
    recentProjects: Project[]
    isLoading: boolean
    error: Error | null
    addLocalProject: () => Promise<void>
    openProject: (dir: string) => Promise<void>
    removeRecentProject: (dir: string) => Promise<void>
    closeProject: () => void
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
 * by the `window.api.project` bridge.
 */
export default function ProjectProvider({ children }: ProjectProviderProps) {
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const [recentProjects, setRecentProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    /**
     * Refreshes the recent projects list from the store.
     */
    const refreshRecentProjects = useCallback(async () => {
        setRecentProjects(await window.api.project.getRecent())
    }, [])

    /**
     * Runs an open action, reflecting its outcome in the current project and
     * error state, and refreshing the recent projects list afterwards.
     * @param action The open action to run (add local or open by path).
     */
    const runOpen = useCallback(
        async (action: () => Promise<OpenProjectResult>) => {
            try {
                const result = await action()

                if (result.ok) {
                    setCurrentProject(result.project)
                    setError(null)
                } else if (result.reason !== "cancelled") {
                    setError(new Error(result.message ?? "Failed to open the project."))
                }

                await refreshRecentProjects()
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)))
            }
        },
        [refreshRecentProjects],
    )

    /**
     * Prompts the user to pick a local folder and opens it as the current project.
     */
    const addLocalProject = useCallback(() => runOpen(() => window.api.project.addLocal()), [runOpen])

    /**
     * Opens an existing project by path (e.g. from the recent projects list).
     * @param dir The absolute repository path to open.
     */
    const openProject = useCallback((dir: string) => runOpen(() => window.api.project.open(dir)), [runOpen])

    /**
     * Removes a project from the recent projects list, closing it if it is the
     * currently opened project.
     * @param dir The absolute repository path to forget.
     */
    const removeRecentProject = useCallback(async (dir: string) => {
        setRecentProjects(await window.api.project.removeRecent(dir))
        setCurrentProject(current => (current?.path === dir ? null : current))
    }, [])

    /**
     * Closes the current project without affecting the recent projects list.
     */
    const closeProject = useCallback(() => setCurrentProject(null), [])

    // On mount, load the recent projects and, when configured to do so, re-open
    // the most recently opened project.
    useEffect(() => {
        const init = async () => {
            setIsLoading(true)

            try {
                const [projects, preferences] = await Promise.all([
                    window.api.project.getRecent(),
                    window.api.project.getPreferences(),
                ])

                setRecentProjects(projects)

                if (preferences.startupBehavior === "reopen-last" && projects[0]) {
                    await openProject(projects[0].path)
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)))
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
                isLoading,
                error,
                addLocalProject,
                openProject,
                removeRecentProject,
                closeProject,
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
