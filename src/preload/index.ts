import appApiRoutes from "@preload/routes/app"
import dialogApiRoutes from "@preload/routes/dialog"
import gitApiRoutes from "@preload/routes/git"
import lfsApiRoutes from "@preload/routes/lfs"
import projectApiRoutes from "@preload/routes/project"
import shellApiRoutes from "@preload/routes/shell"
import treeApiRoutes from "@preload/routes/tree"
import windowApiRoutes from "@preload/routes/window"
import { contextBridge } from "electron"
import type { ConfirmDialogOptions, DialogOptions } from "@/main/types/dialog"
import type { GitBranch, GitCommit, GitStatus } from "@/main/types/git"
import type { LfsLock, LfsLockResult } from "@/main/types/lfs"
import type { OpenProjectResult } from "@/main/types/project"
import type { AppPreferences, Project } from "@/main/types/store"
import type { FileTreeNode } from "@/main/types/tree"

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
    app: {
        version: string
    }
    platform: {
        value: NodeJS.Platform
        isWindows: boolean
        isLinux: boolean
        isMacOS: boolean
    }
    window: {
        getState: () => Promise<WindowState>
        onStateChange: (callback: (state: WindowState) => void) => () => void
        minimize: () => void
        toggleMaximize: () => void
        close: () => void
    }
    git: {
        isRepository: (dir: string) => Promise<boolean>
        getRepositoryRoot: (dir: string) => Promise<string>
        getStatus: (dir: string) => Promise<GitStatus>
        listBranches: (dir: string) => Promise<GitBranch[]>
        getLog: (dir: string, limit?: number) => Promise<GitCommit[]>
        getRemoteUrl: (dir: string) => Promise<string | null>
    }
    lfs: {
        listLocks: (dir: string) => Promise<LfsLock[]>
        getCachedLocks: (dir: string) => Promise<LfsLock[]>
        getLockableFiles: (dir: string) => Promise<string[]>
        lockPaths: (dir: string, paths: string[]) => Promise<LfsLockResult[]>
        unlockPaths: (dir: string, paths: string[], force?: boolean) => Promise<LfsLockResult[]>
    }
    tree: {
        getFileTree: (dir: string) => Promise<FileTreeNode[]>
    }
    project: {
        addLocal: () => Promise<OpenProjectResult>
        open: (dir: string) => Promise<OpenProjectResult>
        getRecent: () => Promise<Project[]>
        removeRecent: (dir: string) => Promise<Project[]>
        clearRecent: () => Promise<Project[]>
        getPreferences: () => Promise<AppPreferences>
        setPreferences: (preferences: Partial<AppPreferences>) => Promise<AppPreferences>
    }
    shell: {
        openExternal: (url: string) => void
    }
    dialog: {
        confirm: (options: ConfirmDialogOptions) => Promise<boolean>
        error: (title: string, content: string) => void
        getOptions: () => Promise<DialogOptions | null>
        respond: (result: boolean) => void
    }
}

/**
 * The API surface exposed to the renderer process via `window.api`.
 */
const api: GitgameApi = {
    app: appApiRoutes,
    platform: {
        value: process.platform,
        isWindows: process.platform === "win32",
        isLinux: process.platform === "linux",
        isMacOS: process.platform === "darwin",
    },
    window: windowApiRoutes,
    git: gitApiRoutes,
    lfs: lfsApiRoutes,
    tree: treeApiRoutes,
    project: projectApiRoutes,
    shell: shellApiRoutes,
    dialog: dialogApiRoutes,
} as const

// Exposes the API surface to the renderer process
contextBridge.exposeInMainWorld("api", api)
