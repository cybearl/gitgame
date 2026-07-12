import CONSTANTS from "@main/lib/constants"
import { runGit } from "@main/lib/gitCommands/exec"
import { parseBranches, parseLog, parseStatus } from "@main/lib/gitCommands/parse"
import GIT_CONFIG from "@/main/config/git"
import type { GitBranch, GitCommit, GitStatus } from "@/main/types/gitCommands"

/**
 * The `git log` pretty-format string built from the shared format fields,
 * joined by the field separator and terminated by the record separator.
 */
const LOG_PRETTY_FORMAT =
    CONSTANTS.git.logFormat.join(CONSTANTS.git.logFieldSeparator) + CONSTANTS.git.logRecordSeparator

/**
 * Determines whether the given directory is inside a Git working tree.
 * @param dir The absolute path to probe.
 * @returns True if `dir` resolves to a working tree, `false` otherwise.
 */
export async function isRepository(dir: string): Promise<boolean> {
    const result = await runGit(["rev-parse", "--is-inside-work-tree"], { cwd: dir })
    return result.exitCode === 0 && result.stdout.trim() === "true"
}

/**
 * Resolves the absolute path to the top level of the working tree containing `dir`.
 * @param dir A path somewhere inside the repository.
 * @returns The absolute repository root path.
 * @throws If `dir` is not inside a Git repository.
 */
export async function getRepositoryRoot(dir: string): Promise<string> {
    const result = await runGit(["rev-parse", "--show-toplevel"], { cwd: dir })
    if (result.exitCode !== 0) {
        throw new Error(result.stderr.trim() || `"${dir}" is not inside a Git repository.`)
    }

    return result.stdout.trim()
}

/**
 * Reads the working tree and branch status of a repository.
 * @param dir A path inside the repository.
 * @returns The parsed `GitStatus` snapshot.
 * @throws If the status command fails (e.g. `dir` is not a repository).
 */
export async function getStatus(dir: string): Promise<GitStatus> {
    const result = await runGit(["status", "--porcelain=v2", "--branch"], { cwd: dir })
    if (result.exitCode !== 0) {
        throw new Error(result.stderr.trim() || "Failed to read repository status.")
    }

    return parseStatus(result.stdout)
}

/**
 * Lists the local branches of a repository along with their upstreams.
 * @param dir A path inside the repository.
 * @returns The parsed `GitBranch` entries.
 * @throws If the branch listing command fails.
 */
export async function listBranches(dir: string): Promise<GitBranch[]> {
    const result = await runGit(["branch", "--format=%(HEAD)%(refname:short)%09%(upstream:short)"], { cwd: dir })
    if (result.exitCode !== 0) {
        throw new Error(result.stderr.trim() || "Failed to list branches.")
    }

    return parseBranches(result.stdout)
}

/**
 * Reads the most recent commits from the current branch's history.
 * @param dir A path inside the repository.
 * @param limit The maximum number of commits to return.
 * @returns The parsed `GitCommit` entries, newest first.
 * @throws If the log command fails.
 */
export async function getLog(dir: string, limit: number = GIT_CONFIG.defaultLogOutputLimit): Promise<GitCommit[]> {
    const result = await runGit(["log", `--max-count=${limit}`, `--pretty=format:${LOG_PRETTY_FORMAT}`], { cwd: dir })
    if (result.exitCode !== 0) {
        throw new Error(result.stderr.trim() || "Failed to read repository history.")
    }

    return parseLog(result.stdout)
}

/**
 * Reads the URL of the `origin` remote, if the repository has one configured.
 * @param dir A path inside the repository.
 * @returns The remote URL, or `null` when `origin` is not configured.
 */
export async function getRemoteUrl(dir: string): Promise<string | null> {
    const result = await runGit(["remote", "get-url", "origin"], { cwd: dir })
    if (result.exitCode !== 0) return null

    const url = result.stdout.trim()
    return url.length > 0 ? url : null
}
