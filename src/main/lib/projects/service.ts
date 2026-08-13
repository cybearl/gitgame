import path from "node:path"
import STORE_CONFIG from "@main/config/store"
import { getRepositoryRoot, isRepository } from "@main/lib/gitCommands/service"
import { stateStore } from "@main/lib/stores/state"
import { readUProject } from "@main/lib/uproject/service"
import { pathExists } from "@main/lib/utils/fs"
import { app, type BrowserWindow, dialog } from "electron"
import type { OpenProjectResult, Project } from "@/main/types/projects"
import type { UProject } from "@/main/types/uproject"

/**
 * Records a repository as the most recently opened project, moving it to the
 * front of the recent projects list (deduplicated by path and capped).
 * @param root The absolute repository root path.
 * @param uproject Metadata read from the repository's `.uproject` file.
 * @returns The stored recent project entry.
 */
async function rememberProject(root: string, uproject: UProject): Promise<Project> {
    const entry: Project = {
        path: root,
        name: path.basename(root),
        lastOpenedAt: new Date().toISOString(),
        uproject,
    }

    await stateStore.update(state => {
        const others = state.recentProjects.filter(project => project.path !== root)
        state.recentProjects = [entry, ...others].slice(0, STORE_CONFIG.maxRecentProjects)

        return undefined
    })

    return entry
}

/**
 * Opens an existing repository by path, validates and normalizes it to the root,
 * and records it as the most recently opened project, missing paths are dropped
 * from the recent list so this is safe to call when re-opening on launch.
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

    const uproject = await readUProject(root)
    if (!uproject) {
        return {
            ok: false,
            reason: "not-a-ue-project",
            message: `"${root}" is not an Unreal Engine project (no .uproject file at the repo root).`,
        }
    }

    const project = await rememberProject(root, uproject)

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
    const { recentProjects } = await stateStore.get()
    const mostRecent = recentProjects[0]
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
    return (await stateStore.get()).recentProjects
}

/**
 * Removes a project from the recent projects list.
 * @param dir The absolute repository path to forget.
 * @returns The updated recent projects list.
 */
export async function removeRecentProject(dir: string): Promise<Project[]> {
    const updated = await stateStore.update(state => {
        state.recentProjects = state.recentProjects.filter(project => project.path !== dir)
        return undefined
    })

    return updated.recentProjects
}

/**
 * Clears every entry from the recent projects list.
 * @returns The updated recent projects list, which is always empty.
 */
export async function clearRecentProjects(): Promise<Project[]> {
    const updated = await stateStore.update(state => {
        state.recentProjects = []
        return undefined
    })

    return updated.recentProjects
}
