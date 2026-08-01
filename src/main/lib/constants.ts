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
        shellsShowFolder: "shells:show-folder",
        shellsOpenTerminal: "shells:open-terminal",
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
    shells: {
        missingFolderMessage: "The folder no longer exists on disk.",
        openFolderFailureMessage: "The system could not open the folder in the file manager.",
        noTerminalMessage: "No terminal could be launched, none of the ones we know about are installed or on PATH.",

        /**
         * The terminals tried in order when opening a folder in a terminal, the first one that
         * launches wins.
         *
         * Note: Linux has no standard terminal, hence the list, `x-terminal-emulator` comes
         * first because it is the Debian alternatives symlink pointing at the user's choice.
         */
        terminals: {
            win32: [
                { command: "wt.exe", args: ["-d"], appendDir: true },
                { command: "cmd.exe", args: ["/c", "start", "", "cmd.exe"], appendDir: false },
            ],
            darwin: [{ command: "open", args: ["-a", "Terminal"], appendDir: true }],
            linux: [
                { command: "x-terminal-emulator", args: [], appendDir: false },
                { command: "gnome-terminal", args: [], appendDir: false },
                { command: "konsole", args: [], appendDir: false },
                { command: "xfce4-terminal", args: [], appendDir: false },
                { command: "alacritty", args: [], appendDir: false },
                { command: "kitty", args: [], appendDir: false },
                { command: "xterm", args: [], appendDir: false },
            ],
        } as Record<string, { command: string; args: string[]; appendDir: boolean }[]>,
    },
    git: {
        logFieldSeparator: "\x1f",
        logRecordSeparator: "\x1e",
        logFormat: ["%H", "%h", "%s", "%an", "%ae", "%aI"], // Joined with field separator and ends with record separator
    },
} as const

export default CONSTANTS
