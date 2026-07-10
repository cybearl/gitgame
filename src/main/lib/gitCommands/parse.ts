import CONSTANTS from "@/main/lib/constants"
import type { GitBranch, GitCommit, GitFileChange, GitStatus, GitStatusCode } from "@/main/types/gitCommands"

/**
 * Normalizes a single porcelain status character into a {@link GitStatusCode}.
 * @param char The raw status character from a porcelain v2 record.
 * @returns The matching status code, defaulting to unmodified (`.`).
 */
function toStatusCode(char: string): GitStatusCode {
    const valid: GitStatusCode[] = [".", "M", "A", "D", "R", "C", "U", "?", "!"]
    return (valid as string[]).includes(char) ? (char as GitStatusCode) : "."
}

/**
 * Parses a single non-header porcelain v2 line into a `GitFileChange`.
 * @param line The record line (an entry of type `1`, `2`, `u`, `?`, or `!`).
 * @returns The parsed change, or `null` if the line type is unrecognized.
 */
function parseChangeLine(line: string): GitFileChange | null {
    const type = line[0]

    // Untracked and ignored entries: "? <path>" / "! <path>"
    if (type === "?" || type === "!") {
        const path = line.slice(2)
        return {
            path,
            indexStatus: ".",
            workTreeStatus: "?",
            isStaged: false,
            isUntracked: true,
            isConflicted: false,
        }
    }

    // Unmerged entries: "u <xy> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>"
    if (type === "u") {
        const parts = line.split(" ")
        const xy = parts[1] ?? ".."
        const path = parts.slice(10).join(" ")
        return {
            path,
            indexStatus: toStatusCode(xy[0]),
            workTreeStatus: toStatusCode(xy[1]),
            isStaged: false,
            isUntracked: false,
            isConflicted: true,
        }
    }

    // Ordinary ("1") and renamed/copied ("2") entries share a common prefix layout
    if (type === "1" || type === "2") {
        const parts = line.split(" ")

        const xy = parts[1] ?? ".."
        const indexStatus = toStatusCode(xy[0])
        const workTreeStatus = toStatusCode(xy[1])

        if (type === "1") {
            const path = parts.slice(8).join(" ")
            return {
                path,
                indexStatus,
                workTreeStatus,
                isStaged: indexStatus !== ".",
                isUntracked: false,
                isConflicted: false,
            }
        }

        // Renames/copies append "<path>\t<origPath>" after the score field (9th part)
        const remainder = parts.slice(9).join(" ")

        const [path, renamedFrom] = remainder.split("\t")

        return {
            path,
            indexStatus,
            workTreeStatus,
            isStaged: indexStatus !== ".",
            isUntracked: false,
            isConflicted: false,
            renamedFrom,
        }
    }

    return null
}

/**
 * Parses the output of `git status --porcelain=v2 --branch` into a structured `GitStatus`.
 * @param output The raw stdout of the status command.
 * @returns The parsed working tree and branch snapshot.
 */
export function parseStatus(output: string): GitStatus {
    const status: GitStatus = {
        branch: null,
        upstream: null,
        ahead: 0,
        behind: 0,
        isDetached: false,
        isClean: true,
        changes: [],
    }

    for (const line of output.split("\n")) {
        if (!line) continue

        // Branch header lines
        if (line.startsWith("# branch.head ")) {
            const head = line.slice("# branch.head ".length)
            if (head === "(detached)") status.isDetached = true
            else status.branch = head
            continue
        }

        if (line.startsWith("# branch.upstream ")) {
            status.upstream = line.slice("# branch.upstream ".length)
            continue
        }

        if (line.startsWith("# branch.ab ")) {
            const ab = line.slice("# branch.ab ".length).split(" ")

            for (const token of ab) {
                if (token.startsWith("+")) status.ahead = Number.parseInt(token.slice(1), 10) || 0
                else if (token.startsWith("-")) status.behind = Number.parseInt(token.slice(1), 10) || 0
            }

            continue
        }

        if (line.startsWith("#")) continue

        const change = parseChangeLine(line)
        if (change) status.changes.push(change)
    }

    status.isClean = status.changes.length === 0
    return status
}

/**
 * Parses the output of `git branch --list --all -v` (or similar) into structured
 * `GitBranch` entries.
 * @param output The raw stdout of the branch listing command.
 * @returns The parsed branches.
 */
export function parseBranches(output: string): GitBranch[] {
    const branches: GitBranch[] = []

    for (const line of output.split("\n")) {
        if (!line) continue

        const [name, upstream] = line.slice(1).split("\t")
        if (!name) continue

        branches.push({
            name,
            isCurrent: line[0] === "*",
            isRemote: name.startsWith("remotes/") || name.startsWith("origin/"),
            upstream: upstream || null,
        })
    }

    return branches
}

/**
 * Parses the output of `git log` formatted with a specific format into structured `GitCommit` entries.
 * @param output The raw stdout of the log command.
 * @returns The parsed commits, in the order emitted by git.
 */
export function parseLog(output: string): GitCommit[] {
    const commits: GitCommit[] = []

    for (const record of output.split(CONSTANTS.git.logRecordSeparator)) {
        const trimmed = record.trim()
        if (!trimmed) continue

        const [hash, shortHash, subject, author, authorEmail, date] = trimmed.split(CONSTANTS.git.logFieldSeparator)
        if (!hash) continue

        commits.push({
            hash,
            shortHash: shortHash ?? "",
            subject: subject ?? "",
            author: author ?? "",
            authorEmail: authorEmail ?? "",
            date: date ?? "",
        })
    }

    return commits
}
