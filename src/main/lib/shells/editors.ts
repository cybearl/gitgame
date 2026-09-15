import path from "node:path"
import CONSTANTS from "@main/lib/constants"
import { pathExists } from "@main/lib/utils/fs"

/**
 * How a code editor is launched on a folder, ready to be handed to `spawn`.
 */
export type EditorLaunch = {
    command: string
    args: string[]
}

/**
 * Expands the `%VAR%` placeholders of a candidate from the environment, an editor's
 * install directory is only ever known relative to one of them.
 * @param candidate The raw candidate, which may hold placeholders.
 * @returns The expanded candidate, or `null` when one of the variables is unset, which
 * rules the candidate out rather than leaving a hole in its path.
 */
export function expandEnvPlaceholders(candidate: string): string | null {
    let isResolved = true

    const expanded = candidate.replace(/%([^%]+)%/g, (_match, name: string) => {
        const value = process.env[name]
        if (!value) isResolved = false

        return value ?? ""
    })

    return isResolved ? expanded : null
}

/**
 * Builds the command and arguments opening a folder with a given editor, macOS goes
 * through `open` because an editor is an application bundle there rather than an
 * executable that can be spawned on its own.
 * @param target The resolved editor, an executable elsewhere and a bundle on macOS.
 * @param dir The absolute path of the folder to open.
 * @returns The command and its arguments.
 */
function buildEditorLaunch(target: string, dir: string): EditorLaunch {
    if (process.platform === "darwin") {
        return {
            command: CONSTANTS.shells.macOpen.command,
            args: [CONSTANTS.shells.macOpen.appFlag, target, dir],
        }
    }

    return {
        command: target,
        args: [dir],
    }
}

/**
 * Turns an editor candidate into the launch opening a folder with it.
 *
 * Note: an absolute candidate is checked on disk first, macOS reports a missing app
 * through `open`'s exit code rather than through a spawn failure.
 * @param candidate The candidate, an absolute path with optional `%VAR%` placeholders or
 * a bare command name looked up on `PATH`.
 * @param dir The absolute path of the folder to open.
 * @returns The launch to spawn, or `null` when the candidate is unavailable.
 */
export async function resolveEditorLaunch(candidate: string, dir: string): Promise<EditorLaunch | null> {
    const target = expandEnvPlaceholders(candidate)
    if (!target) return null

    if (path.isAbsolute(target) && !(await pathExists(target))) return null

    return buildEditorLaunch(target, dir)
}

/**
 * Lists the editor candidates to try for the current platform, falling back to the Linux
 * ones on a platform we hold no list for.
 * @returns The candidates, in the order they are worth trying.
 */
export function listEditorCandidates(): string[] {
    return CONSTANTS.shells.editors[process.platform] ?? CONSTANTS.shells.editors.linux
}
