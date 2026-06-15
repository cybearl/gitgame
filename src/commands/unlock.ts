import { convertErrorToString, nextLogger } from "@cybearl/cypack"
import { Command } from "cliffy/command"
import { getLfsFiles, getMyLocks, runCommand } from "@/utils/git.ts"

const log = nextLogger.withPrefix("unlock")

/**
 * Unlock one or more files or folders after exclusive Git LFS editing.
 */
export const unlockCommand = new Command()
    .description("Unlock one or more files or folders")
    .arguments("[paths...:string]")
    .option("--all", "Unlock all files currently locked by you")
    .action(async (options, ...paths) => {
        // --all flag: unlock everything the current user has locked
        if (options.all) {
            const myLocks = await getMyLocks()
            if (myLocks.length === 0) {
                log.warn("You have no active locks.")
                return
            }

            log.info(`Unlocking all ${myLocks.length} of your locks...`)

            for (const file of myLocks) {
                try {
                    await runCommand(["git", "lfs", "unlock", file], { silent: true })
                    log.success(`Unlocked: ${file}`)
                } catch (e) {
                    log.error(`Failed: ${convertErrorToString(e)}`)
                }
            }

            return
        }

        if (!paths || paths.length === 0) {
            log.error("Provide at least one path, or use --all to unlock everything.")
            Deno.exit(1)
        }

        for (const target of paths) {
            let files: string[]

            try {
                files = await getLfsFiles(target)
            } catch (e) {
                log.error(convertErrorToString(e))
                continue
            }

            if (files.length === 0) {
                log.warn(`No LFS-tracked files found in: ${target}`)
                continue
            }

            log.info(`Unlocking ${files.length} file(s) in: ${target}`)

            for (const file of files) {
                try {
                    await runCommand(["git", "lfs", "unlock", file], { silent: true })
                    log.success(`Unlocked: ${file}`)
                } catch (e) {
                    log.error(`Failed to unlock ${file}: ${convertErrorToString(e)}`)
                }
            }
        }
    })
