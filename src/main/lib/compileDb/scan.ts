import { readdir } from "node:fs/promises"
import path from "node:path"
import COMPILE_DB_CONFIG from "@main/config/compileDb"
import { classifySourcePath, resolveWatchRoots, toPosixPath } from "@main/lib/compileDb/paths"
import type { CompileDbFileKind } from "@/main/types/compileDb"

/**
 * Walks a directory tree and collects every file that counts toward the compile
 * database, prunes the generated directories on the way down rather than
 * classifying their contents, so a populated `Intermediate` costs nothing.
 * @param root The absolute repository root path, paths are keyed relative to it.
 * @param dir The absolute directory currently being walked.
 * @param collected The map each match is added to.
 */
async function collectFrom(root: string, dir: string, collected: Map<string, CompileDbFileKind>): Promise<void> {
    // A source tree that does not exist is not an error, plenty of UE projects
    // carry no plugins at all
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])

    for (const entry of entries) {
        const absolutePath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            if (COMPILE_DB_CONFIG.ignoredDirNames.includes(entry.name)) continue
            await collectFrom(root, absolutePath, collected)

            continue
        }

        if (!entry.isFile()) continue

        const relativePath = path.relative(root, absolutePath)
        const kind = classifySourcePath(relativePath)

        if (kind) collected.set(toPosixPath(relativePath), kind)
    }
}

/**
 * Scans the project's source trees for every file the compile database is built
 * from, the baseline the watcher diffs each later change against.
 * @param root The absolute repository root path.
 * @returns The repo-relative path of each relevant file mapped to its kind.
 */
export async function scanSourceFiles(root: string): Promise<Map<string, CompileDbFileKind>> {
    const collected = new Map<string, CompileDbFileKind>()

    for (const watchRoot of resolveWatchRoots(root)) {
        await collectFrom(root, watchRoot, collected)
    }

    return collected
}

/**
 * Diffs a fresh scan against the previous one, reporting only whether files were
 * added or removed and whether any of them described the build, an edit to a file
 * that is already in the database never shows up here because clangd rereads the
 * file itself.
 * @param previous The file map from the last scan.
 * @param next The file map from the current scan.
 * @returns Whether the set moved, and whether a descriptor was part of the move.
 */
export function diffSourceFiles(
    previous: Map<string, CompileDbFileKind>,
    next: Map<string, CompileDbFileKind>,
): { hasChanged: boolean; hasDescriptorChanged: boolean } {
    const changed: CompileDbFileKind[] = []

    for (const [filePath, kind] of next) {
        if (!previous.has(filePath)) changed.push(kind)
    }

    for (const [filePath, kind] of previous) {
        if (!next.has(filePath)) changed.push(kind)
    }

    return {
        hasChanged: changed.length > 0,
        hasDescriptorChanged: changed.includes("descriptor"),
    }
}
