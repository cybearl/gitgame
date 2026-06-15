import { nextLogger } from "@cybearl/cypack"
import { Command } from "cliffy/command"
import { Confirm, Input } from "cliffy/prompt"
import { generateCommitMessage } from "@/utils/ai.ts"
import { getMyLocks, runCommand, runLiveCommand } from "@/utils/git.ts"
import { loadUserConfig } from "@/utils/userConfig.ts"

const log = nextLogger.withPrefix("submit")

/**
 * Submit changes to the repository.
 */
export const submitCommand = new Command()
    .description("Stage all changes, commit, push, and auto-unlock your locked files")
    .option("-m, --message <msg:string>", "Commit message (skips prompt)")
    .option("--no-unlock", "Do not unlock files after pushing")
    .option("--bypass-locks", "Skip lock/unlock entirely (useful when working solo)")
    .action(async options => {
        // Check there's something to commit
        const staged = await runCommand(["git", "status", "--porcelain"], { silent: true })
        if (!staged) {
            log.warn("Nothing to commit, working tree is clean.")
            Deno.exit(0)
        }

        const stagedFiles = staged
            .split("\n")
            .filter(Boolean)
            .map(line => line.slice(3).trim())

        log.info("Staged files:")
        stagedFiles.forEach(f => {
            log.info(`  ${f}`)
        })

        // Resolve commit message
        let message = options.message ?? null

        if (!message) {
            const aiConfig = await loadUserConfig()
            if (!aiConfig) {
                log.warn("AI not configured. Run `gitgame setup` to enable commit message generation.")
            } else {
                log.info(`Asking ${aiConfig.ai.provider} (${aiConfig.ai.model}) for a commit message...`)
                const generated = await generateCommitMessage(stagedFiles)

                if (generated) {
                    log.info(`Suggested:\n${generated}`)
                    const useIt = await Confirm.prompt("Use this message?")
                    if (useIt) {
                        message = generated
                    }
                } else {
                    log.warn("AI provider call failed, enter message manually.")
                }
            }
        }

        if (!message) {
            message = await Input.prompt({
                message: "Commit message",
                minLength: 1,
            })
        }

        // Stage all
        await runCommand(["git", "add", "-A"])

        // Commit
        await runCommand(["git", "commit", "-m", message])
        log.success("Committed")

        // Push
        log.info("Pushing...")
        await runLiveCommand(["git", "push"])
        log.success("Pushed")

        // Unlock files (unless bypassed or --no-unlock)
        if (!options.bypassLocks && options.unlock !== false) {
            const myLocks = await getMyLocks()
            if (myLocks.length > 0) {
                log.info(`Unlocking ${myLocks.length} file(s)...`)

                for (const file of myLocks) {
                    await runCommand(["git", "lfs", "unlock", file])
                    log.success(`Unlocked: ${file}`)
                }
            }
        }

        log.success("Done!")
    })
