import { execFile } from "node:child_process"
import path from "node:path"
import { promisify } from "node:util"
import COMPILE_DB_CONFIG from "@main/config/compileDb"
import CONSTANTS from "@main/lib/constants"
import { preferencesStore } from "@main/lib/stores/preferences"
import { pathExists } from "@main/lib/utils/fs"
import type { UProject, UProjectEngineVersion } from "@/main/types/uproject"

/**
 * Promisified version of `child_process.execFile`.
 */
const execFileAsync = promisify(execFile)

/**
 * Escapes the regex meta-characters in a literal, needed because a source build is
 * keyed by the GUID a `.uproject` carries, braces and all.
 * @param literal The text to match literally.
 * @returns The text with every meta-character escaped.
 */
function escapeForRegExp(literal: string): string {
    return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Reads a single value out of the Windows registry, the same lookup the hand
 * written generator scripts do, `null` for a key or value that is not there.
 * @param key The full registry key, in `HKLM\...` short-root form.
 * @param valueName The name of the value to read out of that key.
 * @returns The value's data, or `null` when the lookup found nothing.
 */
async function queryRegistryValue(key: string, valueName: string): Promise<string | null> {
    try {
        const { stdout } = await execFileAsync("reg", ["query", key, "/v", valueName], { windowsHide: true })

        // The data sits after the name and the type on its own line and can hold
        // spaces itself, so everything past the type token is taken verbatim
        const match = stdout.match(new RegExp(`^\\s*${escapeForRegExp(valueName)}\\s+REG_\\w+\\s+(.*)$`, "m"))

        return match?.[1].trim() || null
    } catch {
        return null
    }
}

/**
 * Resolves the install directory of a launcher-installed engine from its version.
 * @param version The major/minor pair parsed off the project's engine association.
 * @returns The engine root, or `null` when that version is not installed.
 */
function resolveVersionedEngineRoot(version: UProjectEngineVersion): Promise<string | null> {
    const key = `${COMPILE_DB_CONFIG.registry.installedEnginesKey}\\${version.major}.${version.minor}`
    return queryRegistryValue(key, COMPILE_DB_CONFIG.registry.installedDirectoryValueName)
}

/**
 * Resolves the install directory of a source-built engine from the opaque
 * association a `.uproject` carries for it, registered per user rather than per
 * machine and keyed by the association itself.
 * @param engineAssociation The raw `EngineAssociation` value from the `.uproject`.
 * @returns The engine root, or `null` when no build is registered under it.
 */
function resolveSourceBuildEngineRoot(engineAssociation: string): Promise<string | null> {
    return queryRegistryValue(COMPILE_DB_CONFIG.registry.sourceBuildsKey, engineAssociation)
}

/**
 * Resolves where a launcher install of a given version lands on macOS, which has
 * no registry to ask and puts every install under one shared directory.
 * @param version The major/minor pair parsed off the project's engine association.
 * @returns The engine root, or `null` when nothing sits at that path.
 */
async function resolveMacEngineRoot(version: UProjectEngineVersion): Promise<string | null> {
    const root = path.join(
        COMPILE_DB_CONFIG.macEnginesDir,
        `${COMPILE_DB_CONFIG.macEngineDirPrefix}${version.major}.${version.minor}`,
    )

    return (await pathExists(root)) ? root : null
}

/**
 * Walks the lookups in turn and keeps the first engine root any of them yields,
 * the preference override comes first so a source build on a platform we cannot
 * discover automatically can always be pointed at by hand.
 * @param uproject The parsed `.uproject` metadata of the open project.
 * @returns The engine root, or `null` when none of the lookups found one.
 */
async function discoverEngineRoot(uproject: UProject): Promise<string | null> {
    const { unrealEngineRoot } = preferencesStore.get()
    if (unrealEngineRoot.trim()) return unrealEngineRoot.trim()

    if (process.platform === "win32") {
        if (uproject.engineVersion) {
            const versioned = await resolveVersionedEngineRoot(uproject.engineVersion)
            if (versioned) return versioned
        }

        // A project on a source build carries a GUID rather than a version, and a
        // versioned one can still have been overridden by a local build
        if (uproject.engineAssociation) {
            const sourceBuild = await resolveSourceBuildEngineRoot(uproject.engineAssociation)
            if (sourceBuild) return sourceBuild
        }

        return null
    }

    return uproject.engineVersion ? resolveMacEngineRoot(uproject.engineVersion) : null
}

/**
 * Builds the absolute path of the build entry point inside an engine install for
 * the current platform.
 * @param engineRoot The absolute engine root path.
 * @returns The absolute path of the platform's build script.
 */
export function resolveBuildScriptPath(engineRoot: string): string {
    const segments = COMPILE_DB_CONFIG.buildScriptPaths[process.platform] ?? COMPILE_DB_CONFIG.buildScriptPaths.linux
    return path.join(engineRoot, ...segments)
}

/**
 * Resolves the engine install a project is associated with and confirms it holds
 * a build script we can drive, the one lookup a hand-written generator script
 * would otherwise have to hard-code per machine.
 * @param uproject The parsed `.uproject` metadata of the open project.
 * @returns The engine root, guaranteed to hold the platform's build script.
 * @throws When no install could be found, or the one found holds no build script.
 */
export async function resolveEngineRoot(uproject: UProject): Promise<string> {
    const engineRoot = await discoverEngineRoot(uproject)

    if (!engineRoot) {
        throw new Error(
            `${CONSTANTS.compileDb.missingEngineMessage} (engine association: "${uproject.engineAssociation || "none"}")`,
        )
    }

    if (!(await pathExists(resolveBuildScriptPath(engineRoot)))) {
        throw new Error(`${CONSTANTS.compileDb.missingBuildScriptMessage}\n\n${engineRoot}`)
    }

    return engineRoot
}
