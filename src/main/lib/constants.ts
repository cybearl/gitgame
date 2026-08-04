/**
 * The constants for the main process.
 */
const CONSTANTS = {
    titleBarHeight: 28,
    macOSTrafficLightsHeight: 14,
    macOSTitleBarLeftPadding: 80,
    ipc: {
        // App
        appGetVersion: "app:get-version",
        appConsumeFirstLoad: "app:consume-first-load",
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
        // Updater
        updaterGetState: "updater:get-state",
        updaterStateChanged: "updater:state-changed",
        updaterCheck: "updater:check",
        updaterDownload: "updater:download",
        updaterInstall: "updater:install",
        updaterOpenDialog: "updater:open-dialog",
        updaterSimulate: "updater:simulate",
        // MCP
        mcpGetState: "mcp:get-state",
        mcpStateChanged: "mcp:state-changed",
        mcpProbe: "mcp:probe",
        mcpGetEditorActivity: "mcp:get-editor-activity",
        mcpListTools: "mcp:list-tools",
        mcpCallTool: "mcp:call-tool",
        // Auto-lock
        autoLockPreviewTargets: "auto-lock:preview-targets",
        autoLockReconcile: "auto-lock:reconcile",
        autoLockGetState: "auto-lock:get-state",
        autoLockStateChanged: "auto-lock:state-changed",
        autoLockStart: "auto-lock:start",
        autoLockStop: "auto-lock:stop",
    },
    updater: {
        devCheckMessage:
            'Update checks are disabled in development builds, use the "Dev Tools" menu to preview the update dialog.',
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
         * The terminals tried in order when opening a folder, first launch wins, Linux
         * has no canonical terminal so `x-terminal-emulator` (the Debian alternatives
         * symlink to the user's default) is tried first, then common fallbacks.
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
    mcp: {
        sessionHeader: "mcp-session-id",
        scratchLevelPrefix: "/Temp/",
        gamePrefix: "/Game/",
        contentDir: "Content",
        assetExtension: ".uasset",
        levelExtension: ".umap",
        // The Unreal MCP exposes editor tools through a `call_tool` dispatcher rather
        // than as first-class MCP tools, so each entry pairs the toolset owning it with
        // its short name
        dispatcher: "call_tool",
        tools: {
            getOpenAssets: {
                toolset: "EditorToolset.EditorAppToolset",
                name: "GetOpenAssets",
            },
            getCurrentLevel: {
                toolset: "editor_toolset.toolsets.scene.SceneTools",
                name: "get_current_level",
            },
            isDirty: {
                toolset: "editor_toolset.toolsets.asset.AssetTools",
                name: "is_dirty",
            },
            getPluginContentPaths: {
                toolset: "editor_toolset.toolsets.asset.AssetTools",
                name: "get_plugin_content_paths",
            },
        },
    },
} as const

export default CONSTANTS
