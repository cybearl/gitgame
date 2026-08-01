import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import CONSTANTS from "@main/lib/constants"
import { pathExists } from "@main/lib/utils/fs"
import { shell } from "electron"
import type { UProject, UProjectEngineVersion } from "@/main/types/uproject"

/**
 * Parse an `EngineAssociation` string into a `major.minor` pair. Version-style associations
 * like `"5.8"` or `"5.4.4"` return the parsed pair, GUID or opaque associations return `null`.
 * @param engineAssociation The raw `EngineAssociation` value from a `.uproject` file.
 * @returns Parsed major/minor version, or `null` when the string isn't a plain version.
 */
function parseEngineVersion(engineAssociation: string): UProjectEngineVersion | null {
    const match = engineAssociation.match(/^(\d+)\.(\d+)/)
    if (!match) return null

    return { major: Number(match[1]), minor: Number(match[2]) }
}

/**
 * Scan a directory for the first file with a `.uproject` extension.
 * @param dir Absolute path to the directory to scan.
 * @returns The absolute path to the `.uproject` file, or `null` when none is found.
 */
async function findUProjectFile(dir: string): Promise<string | null> {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
        if (entry.isFile() && entry.name.toLowerCase().endsWith(".uproject")) {
            return path.join(dir, entry.name)
        }
    }

    return null
}

/**
 * Read the `.uproject` file at the given repository root and return its parsed metadata,
 * returns `null` when no `.uproject` file exists at the root (the directory is not a UE
 * project).
 * @param root Absolute path to the repository root.
 * @returns Parsed `UProject` metadata, or `null` when no `.uproject` is present.
 * @throws When a `.uproject` file exists but its JSON is malformed.
 */
export async function readUProject(root: string): Promise<UProject | null> {
    const uprojectPath = await findUProjectFile(root)
    if (!uprojectPath) return null

    const raw = await readFile(uprojectPath, "utf-8")
    const parsed = JSON.parse(raw) as { EngineAssociation?: unknown }

    const engineAssociation = typeof parsed.EngineAssociation === "string" ? parsed.EngineAssociation : ""
    const name = path.basename(uprojectPath, path.extname(uprojectPath))

    return {
        path: uprojectPath,
        name,
        engineAssociation,
        engineVersion: parseEngineVersion(engineAssociation),
    }
}

/**
 * Hand the project's `.uproject` file to the OS so it opens in whichever Unreal Engine
 * build is registered for it.
 * @param root Absolute path to the repository root.
 * @returns The `UProject` metadata as it was resolved at launch time.
 * @throws When the folder is gone, holds no `.uproject` file, or the OS has no handler for it.
 */
export async function openUProject(root: string): Promise<UProject> {
    if (!(await pathExists(root))) throw new Error(CONSTANTS.uproject.missingDirectoryMessage)

    const uproject = await readUProject(root)
    if (!uproject) throw new Error(CONSTANTS.uproject.missingFileMessage)

    // Returns an empty string if it worked, or an error message if it didn't
    const failure = await shell.openPath(uproject.path)
    if (failure) throw new Error(`${CONSTANTS.uproject.openFailureMessage}\n\n${failure}`)

    return uproject
}
