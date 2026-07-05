import { access } from "node:fs/promises"
import path from "node:path"
import STORE_CONFIG from "@main/config/store"
import { getRepositoryRoot, isRepository } from "@main/lib/git/service"
import { getConfig, updateConfig } from "@main/lib/store"
import { app, type BrowserWindow, dialog } from "electron"
import type { OpenProjectResult } from "@/main/types/project"
import type { AppPreferences, Project } from "@/main/types/store"

/**
 * Checks whether a path currently exists on disk.
 * @param target The absolute path to check.
 * @returns True if the path exists, `false` otherwise.
 */
async function pathExists(target: string): Promise<boolean> {
    try {
        await access(target)
        return true
    } catch {
        return false
    }
}

/**
 * Records a repository as the most recently opened project, moving it to the
 * front of the recent projects list (deduplicated by path and capped).
 * @param root The absolute repository root path.
 * @returns The stored recent project entry.
 */
async function rememberProject(root: string): Promise<Project> {
    const entry: Project = {
        path: root,
        name: path.basename(root),
        lastOpenedAt: new Date().toISOString(),
    }

    await updateConfig(config => {
        const others = config.recentProjects.filter(project => project.path !== root)
        config.recentProjects = [entry, ...others].slice(0, STORE_CONFIG.maxRecentProjects)

        return undefined
    })

    return entry
}

/**
 * Opens an existing repository by path, also validates that it exists and is a Git
 * repository, normalizes the path to the repository root, and records it as the
 * most recently opened project.
 *
 * Note: When the path no longer exists it is dropped from the recent projects list, so
 * this doubles as the safe entry point for re-opening a remembered project on
 * launch.
 * @param dir A path inside (or at the root of) the repository.
 * @returns The outcome of the open attempt.
 */
export async function openProject(dir: string): Promise<OpenProjectResult> {
    if (!(await pathExists(dir))) {
        await removeRecentProject(dir)
        return {
            ok: false,
            reason: "not-found",
            message: `"${dir}" no longer exists.`,
        }
    }

    if (!(await isRepository(dir))) {
        return {
            ok: false,
            reason: "not-a-repository",
            message: `"${dir}" is not a Git repository.`,
        }
    }

    const root = await getRepositoryRoot(dir)
    const project = await rememberProject(root)

    return {
        ok: true,
        project,
    }
}

/**
 * Prompts the user to pick a local folder, then opens it as a project.
 * @param window The window that owns the dialog, or `null` to show it detached.
 * @returns The outcome of the open attempt, including cancellation.
 */
export async function addLocalProject(window: BrowserWindow | null): Promise<OpenProjectResult> {
    const config = await getConfig()
    const mostRecent = config.recentProjects[0]
    const defaultPath = mostRecent ? path.dirname(mostRecent.path) : app.getPath("home")

    const options: Electron.OpenDialogOptions = { properties: ["openDirectory"], defaultPath }
    const selection = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options)

    if (selection.canceled || selection.filePaths.length === 0) {
        return {
            ok: false,
            reason: "cancelled",
        }
    }

    return openProject(selection.filePaths[0])
}

/**
 * Returns the recent projects list, most recently opened first.
 * @returns The recent projects.
 */
export async function getRecentProjects(): Promise<Project[]> {
    return (await getConfig()).recentProjects
}

/**
 * Removes a project from the recent projects list.
 * @param dir The absolute repository path to forget.
 * @returns The updated recent projects list.
 */
export async function removeRecentProject(dir: string): Promise<Project[]> {
    const updated = await updateConfig(config => {
        config.recentProjects = config.recentProjects.filter(project => project.path !== dir)
        return undefined
    })

    return updated.recentProjects
}

/**
 * Returns the current application preferences.
 * @returns The preferences.
 */
export async function getPreferences(): Promise<AppPreferences> {
    return (await getConfig()).preferences
}

/**
 * Merges the given fields into the application preferences and persists them.
 * @param preferences The preference fields to update.
 * @returns The updated preferences.
 */
export async function setPreferences(preferences: Partial<AppPreferences>): Promise<AppPreferences> {
    const updated = await updateConfig(config => {
        config.preferences = {
            ...config.preferences,
            ...preferences,
        }

        return undefined
    })

    return updated.preferences
}
