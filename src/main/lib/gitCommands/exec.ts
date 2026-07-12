import { execFile } from "node:child_process"
import { promisify } from "node:util"
import type { GitResult } from "@/main/types/gitCommands"

const execFileAsync = promisify(execFile)

/**
 * The maximum amount of stdout/stderr (in bytes) buffered from a single `git`
 * invocation before the process is killed.
 */
const MAX_BUFFER = 64 * 1024 * 1024

/**
 * Options controlling a single `git` invocation.
 */
export type RunGitOptions = {
    cwd: string
}

/**
 * Runs a `git` subprocess and buffers its output, the promise is only rejected
 * if the `git` binary cannot be spawned.
 * @param args The arguments passed to `git`, excluding the `git` binary itself.
 * @param options The invocation options (currently the working directory).
 * @returns The captured stdout, stderr, and exit code of the process.
 */
export async function runGit(args: string[], options: RunGitOptions): Promise<GitResult> {
    try {
        const { stdout, stderr } = await execFileAsync("git", args, {
            cwd: options.cwd,
            maxBuffer: MAX_BUFFER,
            windowsHide: true,
        })

        return {
            stdout,
            stderr,
            exitCode: 0,
        }
    } catch (error) {
        const err = error as NodeJS.ErrnoException & {
            stdout?: string
            stderr?: string
            code?: number | string
        }

        // A missing `git` binary surfaces as a spawn error with a string code (e.g. "ENOENT")
        if (typeof err.code === "string") {
            throw new Error(`Failed to run git (${err.code}). Is git installed and on your PATH?`)
        }

        // Otherwise git ran but exited non-zero
        return {
            stdout: err.stdout ?? "",
            stderr: err.stderr ?? "",
            exitCode: typeof err.code === "number" ? err.code : 1,
        }
    }
}
