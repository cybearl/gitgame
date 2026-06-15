import { convertErrorToString, nextLogger } from "@cybearl/cypack"
import { Command } from "cliffy/command"
import { getLfsFiles, runCommand } from "@/utils/git.ts"

const log = nextLogger.withPrefix("lock")

/**
 * Lock one or more files or folders for exclusive editing via Git LFS.
 */
export const lockCommand = new Command()
    .description("Lock one or more files or folders for exclusive editing")
    .arguments("<paths...:string>")
    .action(async (_options, ...paths) => {
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

            log.info(`Locking ${files.length} file(s) in: ${target}`)

            for (const file of files) {
                try {
                    await runCommand(["git", "lfs", "lock", file], { silent: true })
                    log.success(`Locked: ${file}`)
                } catch (e) {
                    log.error(`Failed to lock ${file}: ${convertErrorToString(e)}`)
                }
            }
        }
    })
