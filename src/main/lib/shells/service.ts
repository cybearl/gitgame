import { spawn } from "node:child_process"
import { stat } from "node:fs/promises"
import CONSTANTS from "@main/lib/constants"
import { shell } from "electron"

/**
 * Confirm a path is a directory, so a renderer-provided string can only ever reach the OS
 * as a folder and never as an executable.
 * @param dir Absolute path to check.
 * @throws When the path is missing or is not a directory.
 */
async function assertDirectory(dir: string): Promise<void> {
    const stats = await stat(dir).catch(() => null)
    if (!stats?.isDirectory()) throw new Error(CONSTANTS.shells.missingFolderMessage)
}

/**
 * Launch a detached process and report whether it actually started, a command that is not
 * installed surfaces asynchronously through the `error` event rather than throwing here.
 * @param command The executable to run.
 * @param args The arguments passed to it.
 * @param cwd The working directory the process starts in.
 * @returns True when the process spawned, `false` when the command is unavailable.
 */
function trySpawn(command: string, args: string[], cwd: string): Promise<boolean> {
    return new Promise(resolve => {
        const child = spawn(command, args, { cwd, detached: true, stdio: "ignore" })

        child.once("spawn", () => {
            // Lets the terminal outlive the app rather than dying alongside it
            child.unref()
            resolve(true)
        })

        child.once("error", () => resolve(false))
    })
}

/**
 * Open a folder in the OS file manager (via the default handler).
 * @param dir Absolute path to the folder to open.
 * @throws When the path is not a directory, or the OS refuses to open it.
 */
export async function showFolder(dir: string): Promise<void> {
    await assertDirectory(dir)

    // Returns an empty string if it worked, or an error message if it didn't
    const failure = await shell.openPath(dir)
    if (failure) throw new Error(`${CONSTANTS.shells.openFolderFailureMessage}\n\n${failure}`)
}

/**
 * Open a terminal with the given folder as its working directory, trying each candidate
 * for the platform in turn and keeping the first one that launches.
 * @param dir Absolute path to the folder to open the terminal in.
 * @throws When the path is not a directory, or no known terminal could be launched.
 */
export async function openTerminal(dir: string): Promise<void> {
    await assertDirectory(dir)

    const candidates = CONSTANTS.shells.terminals[process.platform] ?? CONSTANTS.shells.terminals.linux

    for (const candidate of candidates) {
        const args = candidate.appendDir ? [...candidate.args, dir] : candidate.args
        if (await trySpawn(candidate.command, args, dir)) return
    }

    throw new Error(CONSTANTS.shells.noTerminalMessage)
}
