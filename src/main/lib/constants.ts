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
        // Shells
        shellsOpenExternal: "shells:open-external",
        // Dialogs
        dialogsConfirm: "dialogs:confirm",
        dialogsError: "dialogs:error",
        dialogsGetOptions: "dialogs:get-options",
        dialogsRespond: "dialogs:respond",
    },
    git: {
        logFieldSeparator: "\x1f",
        logRecordSeparator: "\x1e",
        logFormat: ["%H", "%h", "%s", "%an", "%ae", "%aI"], // Joined with field separator and ends with record separator
    },
    uasset: {
        // Highest "LegacyFileVersion" the summary reader handles, anything below (i.e. more
        // negative) uses a summary layout we haven't verified against UE source
        currentLegacyFileVersion: -9,
        // Prefix that marks user-created (game content) asset packages, imports whose outer
        // chain terminates outside this prefix are engine/plugin classes
        gamePackagePrefix: "/Game/",
        // Bit values of "EPropertyTagFlags", the uint8 bitmask on every property tag header
        propertyTagFlag: {
            hasArrayIndex: 0x01,
            hasPropertyGuid: 0x02,
            hasPropertyExtensions: 0x04,
            hasBinaryOrNativeSerialize: 0x08,
            boolTrue: 0x10,
            skippedSerialize: 0x20,
        },
        // Bit values of "EPropertyTagExtension", the uint8 bitmask written when "hasPropertyExtensions" is set
        propertyTagExtension: {
            overridableInformation: 0x02,
            hasExternalsObjects: 0x04,
        },
        // Blueprint-specific magic strings the shaper matches on
        blueprint: {
            componentSuffix: "_GEN_VARIABLE",
            compiledClassSuffix: "_C",
        },
    },
} as const

export default CONSTANTS
