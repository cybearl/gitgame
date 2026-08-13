import path from "node:path"
import COMPILE_DB_CONFIG from "@main/config/compileDb"
import type { CompileDbFileKind } from "@/main/types/compileDb"

/**
 * Rewrites a path onto forward slashes, so the segment checks below read the
 * same on Windows as they do everywhere else.
 * @param target The path to normalize.
 * @returns The path with forward-slash separators.
 */
export function toPosixPath(target: string): string {
    return target.split(path.sep).join("/")
}

/**
 * Whether any segment of a path is one of the generated directories, checked on
 * the whole path rather than the leaf so a nested `Intermediate` is caught too.
 * @param posixPath The forward-slash repo-relative path.
 * @returns True when the path sits under a generated directory.
 */
function hasIgnoredSegment(posixPath: string): boolean {
    return posixPath.split("/").some(segment => COMPILE_DB_CONFIG.ignoredDirNames.includes(segment))
}

/**
 * Whether a repo-relative path sits anywhere under the project's plugins.
 * @param posixPath The forward-slash repo-relative path.
 * @returns True when the path belongs to a plugin.
 */
function isInsidePlugins(posixPath: string): boolean {
    return posixPath.split("/")[0] === COMPILE_DB_CONFIG.pluginsDirName
}

/**
 * Whether a repo-relative path sits inside one of the source trees, either the
 * project's own `Source` or the `Source` of any plugin, at whatever depth that
 * plugin sits at.
 * @param posixPath The forward-slash repo-relative path.
 * @returns True when the path belongs to a source tree.
 */
function isInsideSourceTree(posixPath: string): boolean {
    const segments = posixPath.split("/")

    if (segments[0] === COMPILE_DB_CONFIG.sourceRootDirName) return true
    if (segments[0] === COMPILE_DB_CONFIG.pluginsDirName) {
        return segments.slice(2).includes(COMPILE_DB_CONFIG.sourceRootDirName)
    }

    return false
}

/**
 * Resolves what a repo-relative path counts as for the compile database, `null`
 * for anything outside the source trees, under a generated directory, or holding
 * an extension the database does not care about.
 * @param relativePath The repo-relative path, in either separator style.
 * @returns The kind the file counts as, or `null` when it is not relevant.
 */
export function classifySourcePath(relativePath: string): CompileDbFileKind | null {
    const posixPath = toPosixPath(relativePath)
    if (hasIgnoredSegment(posixPath)) return null

    const extension = path.posix.extname(posixPath).toLowerCase()

    // A plugin's own descriptor sits above its `Source` tree rather than inside it,
    // and enabling a module in one moves the build with no source file moving
    if (extension === COMPILE_DB_CONFIG.pluginDescriptorExtension) {
        return isInsidePlugins(posixPath) ? "descriptor" : null
    }

    if (!isInsideSourceTree(posixPath)) return null

    if (COMPILE_DB_CONFIG.moduleDescriptorExtensions.includes(extension)) return "descriptor"
    if (COMPILE_DB_CONFIG.sourceExtensions.includes(extension)) return "source"

    return null
}

/**
 * Builds the absolute paths of the directories worth watching, the project's own
 * `Source` and the whole `Plugins` tree, kept at `Plugins` rather than each
 * plugin's `Source` so a plugin added while the app is open is covered too.
 * @param root The absolute repository root path.
 * @returns The absolute directory paths to watch.
 */
export function resolveWatchRoots(root: string): string[] {
    return [path.join(root, COMPILE_DB_CONFIG.sourceRootDirName), path.join(root, COMPILE_DB_CONFIG.pluginsDirName)]
}
