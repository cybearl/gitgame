/**
 * The raw result of running a `git` subprocess.
 */
export type GitResult = {
    stdout: string
    stderr: string
    exitCode: number
}

/**
 * The state of a single path in the staged (index) or unstaged (working tree)
 * slot, using Git's porcelain codes, `.` means unmodified, other letters follow
 * `git status` conventions (`M`, `A`, `D`, `R`, `C`, `U`, `?`, `!`).
 */
export type GitStatusCode = "." | "M" | "A" | "D" | "R" | "C" | "U" | "?" | "!"

/**
 * A single changed path reported by `git status`.
 */
export type GitFileChange = {
    path: string
    indexStatus: GitStatusCode
    workTreeStatus: GitStatusCode
    isStaged: boolean
    isUntracked: boolean
    isConflicted: boolean
    renamedFrom?: string
}

/**
 * A snapshot of the working tree and current branch, derived from
 * `git status --porcelain=v2 --branch`.
 */
export type GitStatus = {
    branch: string | null
    upstream: string | null
    ahead: number
    behind: number
    isDetached: boolean
    isClean: boolean
    changes: GitFileChange[]
}

/**
 * A local or remote branch reference.
 */
export type GitBranch = {
    name: string
    isCurrent: boolean
    isRemote: boolean
    upstream: string | null
}

/**
 * A single commit from the repository history.
 */
export type GitCommit = {
    hash: string
    shortHash: string
    subject: string
    author: string
    authorEmail: string
    date: string
}
