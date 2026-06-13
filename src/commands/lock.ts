import { bold, cyan, green, red, yellow } from "@std/fmt/colors"
import { Command } from "cliffy/command"
import { getLfsFiles, runCommand } from "../utils/git.ts"

/**
 * Lock one or more files or folders for exclusive editing via Git LFS.
 */
export const lockCommand = new Command()
    .description("Lock one or more files or folders for exclusive editing")
    .arguments("<paths...:string>")
    .action(async (_options, ...paths) => {
        console.log(cyan(bold("\n🔒 gitgame lock\n")))

        for (const target of paths) {
            let files: string[]

            try {
                files = await getLfsFiles(target)
            } catch (e) {
                console.log(red(`  ✘ ${e instanceof Error ? e.message : e}`))
                continue
            }

            if (files.length === 0) {
                console.log(yellow(`  No LFS-tracked files found in: ${target}`))
                continue
            }

            console.log(bold(`Locking ${files.length} file(s) in: ${target}`))

            for (const file of files) {
                try {
                    await runCommand(["git", "lfs", "lock", file], { silent: true })
                    console.log(green(`  ✔ Locked: ${file}`))
                } catch (e) {
                    console.log(red(`  ✘ Failed to lock ${file}: ${e instanceof Error ? e.message : e}`))
                }
            }
        }

        console.log()
    })
