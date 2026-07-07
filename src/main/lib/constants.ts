/**
 * The constants used throughout the application.
 */
const CONSTANTS = {
    titleBarHeight: 28,
    macOSTrafficLightsHeight: 14,
    macOSTitleBarLeftPadding: 80,
    ipc: {
        // App
        appGetVersion: "app:get-version",
        // Window
        windowGetState: "window:get-state",
        windowStateChanged: "window:state-changed",
        windowMinimize: "window:minimize",
        windowMaximizeToggle: "window:maximize-toggle",
        windowClose: "window:close",
        // Git
        gitIsRepository: "git:is-repository",
        gitGetRepositoryRoot: "git:get-repository-root",
        gitGetStatus: "git:get-status",
        gitListBranches: "git:list-branches",
        gitGetLog: "git:get-log",
        // LFS
        lfsListLocks: "lfs:list-locks",
        lfsGetCachedLocks: "lfs:get-cached-locks",
        lfsGetLockableFiles: "lfs:get-lockable-files",
        lfsLockPaths: "lfs:lock-paths",
        lfsUnlockPaths: "lfs:unlock-paths",
        // Tree
        treeGetFileTree: "tree:get-file-tree",
        // Project
        projectAddLocal: "project:add-local",
        projectOpen: "project:open",
        projectGetRecent: "project:get-recent",
        projectRemoveRecent: "project:remove-recent",
        projectClearRecent: "project:clear-recent",
        projectGetPreferences: "project:get-preferences",
        projectSetPreferences: "project:set-preferences",
        // Shell
        shellOpenExternal: "shell:open-external",
        // Dialog
        dialogConfirm: "dialog:confirm",
        dialogError: "dialog:error",
        dialogGetOptions: "dialog:get-options",
        dialogRespond: "dialog:respond",
    },
    git: {
        logFieldSeparator: "\x1f",
        logRecordSeparator: "\x1e",
        logFormat: ["%H", "%h", "%s", "%an", "%ae", "%aI"], // Joined with field separator and ends with record separator
    },
} as const

export default CONSTANTS
