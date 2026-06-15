import { Command } from "cliffy/command"
import { lockCommand } from "@/commands/lock.ts"
import { pullCommand } from "@/commands/pull.ts"
import { setupCommand } from "@/commands/setup.ts"
import { statusCommand } from "@/commands/status.ts"
import { submitCommand } from "@/commands/submit.ts"
import { unlockCommand } from "@/commands/unlock.ts"
import GENERAL_CONFIG from "@/config/general.ts"

// Main entry point for the gitgame CLI tool.
await new Command()
    .name(GENERAL_CONFIG.name)
    .version(GENERAL_CONFIG.version)
    .description(GENERAL_CONFIG.description)
    .command("setup", setupCommand)
    .command("status", statusCommand)
    .command("pull", pullCommand)
    .command("lock", lockCommand)
    .command("unlock", unlockCommand)
    .command("submit", submitCommand)
    .parse(Deno.args)
