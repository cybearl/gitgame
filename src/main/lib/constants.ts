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
        // Windows
        windowsGetState: "windows:get-state",
        windowsStateChanged: "windows:state-changed",
        windowsMinimize: "windows:minimize",
        windowsMaximizeToggle: "windows:maximize-toggle",
        windowsClose: "windows:close",
        // Git commands
        gitCommandsIsRepository: "git-commands:is-repository",
        gitCommandsGetRepositoryRoot: "git-commands:get-repository-root",
        gitCommandsGetStatus: "git-commands:get-status",
        gitCommandsListBranches: "git-commands:list-branches",
        gitCommandsGetLog: "git-commands:get-log",
        gitCommandsGetRemoteUrl: "git-commands:get-remote-url",
        // LFS commands
        lfsCommandsListLocks: "lfs-commands:list-locks",
        lfsCommandsGetCachedLocks: "lfs-commands:get-cached-locks",
        lfsCommandsGetLockableFiles: "lfs-commands:get-lockable-files",
        lfsCommandsLockPaths: "lfs-commands:lock-paths",
        lfsCommandsUnlockPaths: "lfs-commands:unlock-paths",
        lfsCommandsLockProgress: "lfs-commands:lock-progress",
        lfsCommandsMigrateLocks: "lfs-commands:migrate-locks",
        // File tree
        fileTreeGet: "file-tree:get",
        // Projects
        projectsAddLocal: "projects:add-local",
        projectsOpen: "projects:open",
        projectsGetRecent: "projects:get-recent",
        projectsRemoveRecent: "projects:remove-recent",
        projectsClearRecent: "projects:clear-recent",
        projectsGetPreferences: "projects:get-preferences",
        projectsSetPreferences: "projects:set-preferences",
        // UProject
        uprojectOpen: "uproject:open",
        // Shells
        shellsOpenExternal: "shells:open-external",
        // Dialogs
        dialogsConfirm: "dialogs:confirm",
        dialogsMessage: "dialogs:message",
        dialogsError: "dialogs:error",
        dialogsErrorWithDetails: "dialogs:error-with-details",
        dialogsGetOptions: "dialogs:get-options",
        dialogsRespond: "dialogs:respond",
    },
    uproject: {
        missingDirectoryMessage: "The project folder no longer exists on disk.",
        missingFileMessage: "No .uproject file was found at the root of the project folder.",
        openFailureMessage:
            "The system could not open the .uproject file, make sure Unreal Engine is installed and registered as the handler for .uproject files.",
    },
    git: {
        logFieldSeparator: "\x1f",
        logRecordSeparator: "\x1e",
        logFormat: ["%H", "%h", "%s", "%an", "%ae", "%aI"], // Joined with field separator and ends with record separator
    },
} as const

export default CONSTANTS
