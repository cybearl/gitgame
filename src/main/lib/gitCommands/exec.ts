import { execFile } from "node:child_process"
import { promisify } from "node:util"
import GIT_CONFIG from "@/main/config/git"
import type { GitResult } from "@/main/types/gitCommands"

/**
 * Promisified version of `child_process.execFile`.
 */
const execFileAsync = promisify(execFile)

/**
 * Options controlling a single `git` invocation.
 */
export type RunGitOptions = {
    cwd: string
    timeoutMs?: number
}

/**
 * Runs a `git` subprocess and buffers its output, the promise is only rejected
 * if the `git` binary cannot be spawned. A `timeoutMs` in the options kills the
 * process on expiry and returns it as a non-zero exit with a "timed out" stderr.
 * @param args The arguments passed to `git`, excluding the `git` binary itself.
 * @param options The invocation options (working directory and optional timeout).
 * @returns The captured stdout, stderr, and exit code of the process.
 */
export async function runGit(args: string[], options: RunGitOptions): Promise<GitResult> {
    try {
        const { stdout, stderr } = await execFileAsync("git", args, {
            cwd: options.cwd,
            maxBuffer: GIT_CONFIG.maxBufferSize,
            windowsHide: true,
            timeout: options.timeoutMs,
        })

        return {
            stdout,
            stderr,
            exitCode: 0,
        }
    } catch (error) {
        const typedError = error as NodeJS.ErrnoException & {
            stdout?: string
            stderr?: string
            code?: number | string
            killed?: boolean
            signal?: NodeJS.Signals | null
        }

        // A missing `git` binary surfaces as a spawn error with a string code (e.g "ENOENT")
        if (typeof typedError.code === "string") {
            throw new Error(`Failed to run git (${typedError.code}). Is git installed and on your PATH?`)
        }

        // A killed process with SIGTERM and a set timeout indicates the timeout fired
        if (typedError.killed && options.timeoutMs) {
            return {
                stdout: typedError.stdout ?? "",
                stderr: typedError.stderr?.trim() || `git timed out after ${options.timeoutMs}ms.`,
                exitCode: typeof typedError.code === "number" ? typedError.code : 1,
            }
        }

        // Otherwise git ran but exited non-zero
        return {
            stdout: typedError.stdout ?? "",
            stderr: typedError.stderr ?? "",
            exitCode: typeof typedError.code === "number" ? typedError.code : 1,
        }
    }
}
