import { readdir } from "node:fs/promises"
import path from "node:path"
import COMPILE_DB_CONFIG from "@main/config/compileDb"

/**
 * Finds the editor target among a project's target descriptors, the one carrying
 * the editor-only modules, and falls back to the conventional name when a project
 * keeps its descriptors somewhere we do not look.
 * @param root The absolute repository root path.
 * @param projectName The `.uproject` file's base name, used for the fallback.
 * @returns The name of the editor target to build the database against.
 */
export async function resolveEditorTarget(root: string, projectName: string): Promise<string> {
    const sourceDir = path.join(root, COMPILE_DB_CONFIG.sourceRootDirName)
    const entries = await readdir(sourceDir, { withFileTypes: true }).catch(() => [])

    const suffix = COMPILE_DB_CONFIG.editorTargetDescriptorSuffix.toLowerCase()
    const descriptor = entries.find(entry => entry.isFile() && entry.name.toLowerCase().endsWith(suffix))

    if (descriptor) {
        return descriptor.name.slice(0, -COMPILE_DB_CONFIG.targetDescriptorSuffix.length)
    }

    return `${projectName}${COMPILE_DB_CONFIG.editorTargetFallbackSuffix}`
}
