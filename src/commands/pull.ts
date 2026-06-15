import { nextLogger } from "@cybearl/cypack"
import { Command } from "cliffy/command"
import { runLiveCommand } from "@/utils/git.ts"

const log = nextLogger.withPrefix("pull")

/**
 * Pull the latest changes from the remote repository.
 */
export const pullCommand = new Command().description("Pull latest changes including LFS files").action(async () => {
    log.info("Pulling latest changes...")

    await runLiveCommand(["git", "pull"])
    await runLiveCommand(["git", "lfs", "pull"])

    log.success("Up to date")
})
