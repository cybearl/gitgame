import { nextLogger } from "@cybearl/cypack"
import { Command } from "cliffy/command"
import { getAllLocks, runCommand } from "@/utils/git.ts"

const log = nextLogger.withPrefix("status")

/**
 * Show the status of the working directory and LFS locks.
 */
export const statusCommand = new Command()
    .description("Show modified files and all active LFS locks")
    .action(async () => {
        // Git status
        const status = await runCommand(["git", "status", "--porcelain"], { silent: true })
        if (status) {
            log.info("Modified files:")

            status
                .split("\n")
                .filter(Boolean)
                .forEach(line => {
                    const flag = line.slice(0, 2).trim()
                    const file = line.slice(3).trim()
                    log.info(`${flag}  ${file}`)
                })
        } else {
            log.success("Working tree is clean")
        }

        // LFS locks
        const locks = await getAllLocks()
        if (locks.length === 0) {
            log.success("No active LFS locks")
            return
        }

        // Get current git user to highlight own locks
        const currentUser = await runCommand(["git", "config", "user.name"], { silent: true }).catch(() => "")

        log.info("Active LFS locks:")

        for (const lock of locks) {
            const marker = lock.owner === currentUser ? "(you)" : `(${lock.owner})`
            log.info(`🔒 ${lock.path} ${marker}`)
        }
    })
