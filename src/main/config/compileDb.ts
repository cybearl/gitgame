/**
 * The configuration for the compile-database watcher.
 */
const COMPILE_DB_CONFIG = {
    /**
     * How long a burst of source-tree changes is left to settle before the
     * regeneration runs, a branch switch can rewrite hundreds of files and has to
     * collapse into a single run.
     */
    debounceMs: 2500,

    /**
     * How long a single build-tool invocation is given before it is killed, the
     * compile database takes about two seconds and a project-files step about
     * five, so this only ever fires on an invocation that is stuck.
     */
    stepTimeoutMs: 5 * 60 * 1000,

    /**
     * The buffer an invocation's output is captured into, the build tool is
     * verbose enough on a failure to overrun the default one.
     */
    maxOutputBufferSize: 4 * 1024 * 1024,

    /**
     * How much of a run's combined output is kept for the details dialog, taken
     * from the tail because the build tool puts the reason it failed at the end.
     */
    maxOutputChars: 8000,

    /**
     * The engine-relative path of the build entry point, keyed by
     * `process.platform`.
     */
    buildScriptPaths: {
        win32: ["Engine", "Build", "BatchFiles", "Build.bat"],
        darwin: ["Engine", "Build", "BatchFiles", "Mac", "Build.sh"],
        linux: ["Engine", "Build", "BatchFiles", "Linux", "Build.sh"],
    } as Record<string, string[]>,

    /**
     * The platform name the target is generated for, keyed by `process.platform`.
     */
    targetPlatforms: {
        win32: "Win64",
        darwin: "Mac",
        linux: "Linux",
    } as Record<string, string>,

    /**
     * The build configuration the database is generated for, `Development` is what
     * the editor itself is built as.
     */
    configuration: "Development",

    /**
     * The build-tool mode that writes a clangd-readable compile database, the
     * `-vscode` project-files generator writes `cl.exe` response files instead and
     * cannot stand in for it.
     */
    clangDatabaseMode: "-mode=GenerateClangDatabase",

    /**
     * The suffix every target descriptor carries, trimmed off the file name to
     * recover the target name itself.
     */
    targetDescriptorSuffix: ".Target.cs",

    /**
     * The suffix marking the editor target among a project's descriptors, the one
     * the compile database has to be generated against so editor-only modules are
     * covered.
     */
    editorTargetDescriptorSuffix: "Editor.Target.cs",

    /**
     * The suffix appended to the project name when a project carries no editor
     * target descriptor to read the name off.
     */
    editorTargetFallbackSuffix: "Editor",

    /**
     * Where the engine installs are recorded on Windows, launcher installs land
     * under a per-version key and source builds under the user's `Builds` key,
     * keyed there by the GUID a `.uproject` carries as its association.
     */
    registry: {
        installedEnginesKey: "HKLM\\SOFTWARE\\EpicGames\\Unreal Engine",
        installedDirectoryValueName: "InstalledDirectory",
        sourceBuildsKey: "HKCU\\SOFTWARE\\Epic Games\\Unreal Engine\\Builds",
    },

    /**
     * Where launcher installs land on macOS, joined with the prefixed version to
     * stand in for the registry lookup Windows gets.
     */
    macEnginesDir: "/Users/Shared/Epic Games",
    macEngineDirPrefix: "UE_",

    /**
     * The root-relative directory holding the project's own modules.
     */
    sourceRootDirName: "Source",

    /**
     * The root-relative directory holding the project's plugins, each of which
     * carries its own `Source` tree.
     */
    pluginsDirName: "Plugins",

    /**
     * The extensions that make a file part of the compile database.
     */
    sourceExtensions: [".cpp", ".c", ".cc", ".cxx", ".h", ".hpp", ".hxx", ".inl"],

    /**
     * The extensions that describe the build itself rather than take part in it,
     * `.cs` covers the `.Build.cs` and `.Target.cs` module descriptors, which live
     * inside the source trees alongside the code they describe.
     */
    moduleDescriptorExtensions: [".cs"],

    /**
     * The extension of a plugin's own descriptor, which sits above the plugin's
     * `Source` tree rather than inside it and so is matched on its own.
     */
    pluginDescriptorExtension: ".uplugin",

    /**
     * The directory names never descended into or watched, the build tool writes
     * generated `.cpp` and `.h` files under `Intermediate` that would otherwise
     * look like hand-written sources and retrigger the watcher on every run.
     */
    ignoredDirNames: ["Intermediate", "Binaries", "Saved", "DerivedDataCache", ".git", "node_modules"],
}

export default COMPILE_DB_CONFIG
