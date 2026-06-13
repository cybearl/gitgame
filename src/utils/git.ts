/**
 * Run a command and return stdout, throws on non-zero exit.
 * @param command The command to run.
 * @param options Options for running the command.
 * @returns The stdout of the command.
 */
export async function runCommand(command: string[], options: { silent?: boolean } = {}): Promise<string> {
    if (!command[0]) throw new Error("No command specified")

    const process = new Deno.Command(command[0], {
        args: command.slice(1),
        stdout: "piped",
        stderr: "piped",
    })

    const { code, stdout, stderr } = await process.output()
    const out = new TextDecoder().decode(stdout).trim()
    const err = new TextDecoder().decode(stderr).trim()

    if (code !== 0) throw new Error(err || `Command failed: ${command.join(" ")}`)

    if (!options.silent && out) console.log(out)
    return out
}

/**
 * Run a command and stream output live (for long operations like push).
 * @param command The command to run.
 */
export async function runLiveCommand(command: string[]) {
    if (!command[0]) throw new Error("No command specified")

    const process = new Deno.Command(command[0], {
        args: command.slice(1),
        stdout: "inherit",
        stderr: "inherit",
    })

    const { code } = await process.output()
    if (code !== 0) throw new Error(`Command failed: ${command.join(" ")}`)
}

/**
 * Get all LFS-tracked files in a given path (file or directory).
 * @param target The path to check.
 * @returns A list of LFS-tracked files.
 */
export async function getLfsFiles(target: string): Promise<string[]> {
    const stat = await Deno.stat(target).catch(() => null)
    if (!stat) throw new Error(`Path not found: ${target}`)

    if (stat.isFile) return [target]

    // If it's a directory, get all LFS-tracked files within it
    const tracked = await runCommand(["git", "lfs", "ls-files", "--name-only"], { silent: true })
    const allTracked = tracked.split("\n").filter(Boolean)

    // Normalize target path for comparison
    const normalizedTarget = target.replace(/\\/g, "/").replace(/\/$/, "")

    return allTracked.filter(
        f => f.replace(/\\/g, "/").startsWith(`${normalizedTarget}/`) || f.replace(/\\/g, "/") === normalizedTarget,
    )
}

/**
 * Get all files currently locked by the current user
 * @returns A list of file paths locked by the current user.
 */
export async function getMyLocks(): Promise<string[]> {
    const output = await runCommand(["git", "lfs", "locks", "--verify", "--json"], { silent: true }).catch(() => "{}")

    try {
        const parsed = JSON.parse(output)
        const ours = parsed.ours ?? []
        return ours.map((l: { path: string }) => l.path)
    } catch {
        return []
    }
}

/**
 * Get all active locks (all users).
 * @returns A list of objects containing the path and owner of each lock.
 */
export async function getAllLocks(): Promise<{ path: string; owner: string }[]> {
    const output = await runCommand(["git", "lfs", "locks", "--json"], { silent: true }).catch(() => "[]")

    try {
        const parsed = JSON.parse(output)
        return parsed.map((l: { path: string; owner: { name: string } }) => ({
            path: l.path,
            owner: l.owner?.name ?? "unknown",
        }))
    } catch {
        return []
    }
}
