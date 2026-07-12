import appApiRoutes from "@preload/routes/app"
import dialogsApiRoutes from "@preload/routes/dialogs"
import fileTreeApiRoutes from "@preload/routes/fileTree"
import gitCommandsApiRoutes from "@preload/routes/gitCommands"
import lfsCommandsApiRoutes from "@preload/routes/lfsCommands"
import projectsApiRoutes from "@preload/routes/projects"
import shellsApiRoutes from "@preload/routes/shells"
import windowsApiRoutes from "@preload/routes/windows"
import { contextBridge } from "electron"
import type { ConfirmDialogOptions, DialogOptions } from "@/main/types/dialogs"
import type { FileTreeNode } from "@/main/types/fileTree"
import type { GitBranch, GitCommit, GitStatus } from "@/main/types/gitCommands"
import type { LfsLock, LfsLockMigration, LfsLockResult } from "@/main/types/lfsCommands"
import type { OpenProjectResult, Project } from "@/main/types/projects"
import type { AppPreferences } from "@/main/types/store"

/**
 * A snapshot of the current state of the application window.
 */
export type WindowState = {
    isFocused: boolean
    isVisible: boolean
    isMinimized: boolean
    isMaximized: boolean
    isFullScreen: boolean
}

/**
 * The type for the API surface exposed to the renderer process via `window.api`.
 */
export type GitgameApi = {
    platform: {
        value: NodeJS.Platform
        isWindows: boolean
        isLinux: boolean
        isMacOS: boolean
    }
    app: {
        version: string
    }
    dialogs: {
        confirm: (options: ConfirmDialogOptions) => Promise<boolean>
        error: (title: string, message: string, detail?: string) => void
        getOptions: () => Promise<DialogOptions | null>
        respond: (result: boolean) => void
    }
    fileTree: {
        get: (dir: string) => Promise<FileTreeNode[]>
    }
    gitCommands: {
        isRepository: (dir: string) => Promise<boolean>
        getRepositoryRoot: (dir: string) => Promise<string>
        getStatus: (dir: string) => Promise<GitStatus>
        listBranches: (dir: string) => Promise<GitBranch[]>
        getLog: (dir: string, limit?: number) => Promise<GitCommit[]>
        getRemoteUrl: (dir: string) => Promise<string | null>
    }
    lfsCommands: {
        listLocks: (dir: string) => Promise<LfsLock[]>
        getCachedLocks: (dir: string) => Promise<LfsLock[]>
        getLockableFiles: (dir: string) => Promise<string[]>
        lockPaths: (
            dir: string,
            paths: string[],
            onProgress?: (done: number, total: number) => void,
        ) => Promise<LfsLockResult[]>
        unlockPaths: (
            dir: string,
            paths: string[],
            force?: boolean,
            onProgress?: (done: number, total: number) => void,
        ) => Promise<LfsLockResult[]>
        migrateLocks: (dir: string) => Promise<LfsLockMigration[]>
    }
    projects: {
        addLocal: () => Promise<OpenProjectResult>
        open: (dir: string) => Promise<OpenProjectResult>
        getRecent: () => Promise<Project[]>
        removeRecent: (dir: string) => Promise<Project[]>
        clearRecent: () => Promise<Project[]>
        getPreferences: () => Promise<AppPreferences>
        setPreferences: (preferences: Partial<AppPreferences>) => Promise<AppPreferences>
    }
    shells: {
        openExternal: (url: string) => void
    }
    windows: {
        getState: () => Promise<WindowState>
        onStateChange: (callback: (state: WindowState) => void) => () => void
        minimize: () => void
        toggleMaximize: () => void
        close: () => void
    }
}

/**
 * The API surface exposed to the renderer process via `window.api`.
 */
const api: GitgameApi = {
    platform: {
        value: process.platform,
        isWindows: process.platform === "win32",
        isLinux: process.platform === "linux",
        isMacOS: process.platform === "darwin",
    },
    app: appApiRoutes,
    dialogs: dialogsApiRoutes,
    fileTree: fileTreeApiRoutes,
    gitCommands: gitCommandsApiRoutes,
    lfsCommands: lfsCommandsApiRoutes,
    projects: projectsApiRoutes,
    shells: shellsApiRoutes,
    windows: windowsApiRoutes,
} as const

// Exposes the API surface to the renderer process
contextBridge.exposeInMainWorld("api", api)
