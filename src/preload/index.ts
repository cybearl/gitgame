import appApiRoutes from "@preload/routes/app"
import audioApiRoutes from "@preload/routes/audio"
import autoLockApiRoutes from "@preload/routes/autoLock"
import compileDbApiRoutes from "@preload/routes/compileDb"
import dialogsApiRoutes from "@preload/routes/dialogs"
import fileTreeApiRoutes from "@preload/routes/fileTree"
import gitCommandsApiRoutes from "@preload/routes/gitCommands"
import lfsCommandsApiRoutes from "@preload/routes/lfsCommands"
import mcpApiRoutes from "@preload/routes/mcp"
import preferencesApiRoutes from "@preload/routes/preferences"
import projectsApiRoutes from "@preload/routes/projects"
import shellsApiRoutes from "@preload/routes/shells"
import updaterApiRoutes from "@preload/routes/updater"
import uprojectApiRoutes from "@preload/routes/uproject"
import viewStateApiRoutes from "@preload/routes/viewState"
import windowsApiRoutes from "@preload/routes/windows"
import { contextBridge } from "electron"
import type { AppSound } from "@/main/types/audio"
import type { AutoLockReconcileResult, AutoLockState } from "@/main/types/autoLock"
import type { CompileDbRunKind, CompileDbRunResult, CompileDbState } from "@/main/types/compileDb"
import type { ConfirmDialogOptions, DialogOptions } from "@/main/types/dialogs"
import type { FileTreeNode } from "@/main/types/fileTree"
import type { GitBranch, GitCommit, GitStatus } from "@/main/types/gitCommands"
import type { LfsLock, LfsLockMigration, LfsLockResult } from "@/main/types/lfsCommands"
import type { EditorActivity, McpState } from "@/main/types/mcp"
import type { OpenProjectResult, Project } from "@/main/types/projects"
import type { AppPreferences, AppViewState } from "@/main/types/store"
import type { UpdaterSimulation, UpdaterState } from "@/main/types/updater"
import type { UProject } from "@/main/types/uproject"

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
        isFirstLoad: boolean
    }
    audio: {
        play: (sound: AppSound) => void
    }
    autoLock: {
        previewTargets: (dir: string) => Promise<string[]>
        reconcile: (dir: string) => Promise<AutoLockReconcileResult>
        getState: () => Promise<AutoLockState>
        onStateChange: (callback: (state: AutoLockState) => void) => () => void
        start: (dir: string) => Promise<void>
        stop: () => Promise<void>
    }
    compileDb: {
        getState: () => Promise<CompileDbState>
        onStateChange: (callback: (state: CompileDbState) => void) => () => void
        regenerate: (kind: CompileDbRunKind) => Promise<CompileDbRunResult | null>
        start: (dir: string) => Promise<void>
        stop: () => Promise<void>
    }
    dialogs: {
        confirm: (options: ConfirmDialogOptions) => Promise<boolean>
        message: (title: string, message: string) => void
        error: (title: string, message: string) => void
        errorWithDetails: (title: string, message: string, details: string) => void
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
    mcp: {
        getState: () => Promise<McpState>
        onStateChange: (callback: (state: McpState) => void) => () => void
        probe: () => Promise<McpState>
        getEditorActivity: () => Promise<EditorActivity>
        listTools: () => Promise<unknown>
        callTool: (toolset: string, name: string, args?: Record<string, unknown>) => Promise<unknown>
    }
    preferences: {
        initial: AppPreferences
        get: () => Promise<AppPreferences>
        set: (patch: Partial<AppPreferences>) => Promise<AppPreferences>
        onChange: (callback: (preferences: AppPreferences) => void) => () => void
        openWindow: () => void
    }
    projects: {
        addLocal: () => Promise<OpenProjectResult>
        open: (dir: string) => Promise<OpenProjectResult>
        getRecent: () => Promise<Project[]>
        removeRecent: (dir: string) => Promise<Project[]>
        clearRecent: () => Promise<Project[]>
    }
    shells: {
        openExternal: (url: string) => void
        showFolder: (dir: string) => Promise<void>
        openTerminal: (dir: string) => Promise<void>
    }
    updater: {
        getState: () => Promise<UpdaterState>
        onStateChange: (callback: (state: UpdaterState) => void) => () => void
        check: (isManualCheck: boolean) => Promise<void>
        download: () => Promise<void>
        install: () => void
        openDialog: () => void
        simulate: (scenario: UpdaterSimulation) => void
    }
    uproject: {
        open: (dir: string) => Promise<UProject>
    }
    viewState: {
        get: () => Promise<AppViewState>
        set: (view: Partial<AppViewState>) => Promise<AppViewState>
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
    audio: audioApiRoutes,
    autoLock: autoLockApiRoutes,
    compileDb: compileDbApiRoutes,
    dialogs: dialogsApiRoutes,
    fileTree: fileTreeApiRoutes,
    gitCommands: gitCommandsApiRoutes,
    lfsCommands: lfsCommandsApiRoutes,
    mcp: mcpApiRoutes,
    preferences: preferencesApiRoutes,
    projects: projectsApiRoutes,
    shells: shellsApiRoutes,
    updater: updaterApiRoutes,
    uproject: uprojectApiRoutes,
    viewState: viewStateApiRoutes,
    windows: windowsApiRoutes,
} as const

// Exposes the API surface to the renderer process
contextBridge.exposeInMainWorld("api", api)
