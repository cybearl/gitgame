import { Command } from "cliffy/command"
import { lockCommand } from "./src/commands/lock.ts"

//import { pullCommand } from "./src/commands/pull.ts"
//import { statusCommand } from "./src/commands/status.ts"
//import { submitCommand } from "./src/commands/submit.ts"
//import { unlockCommand } from "./src/commands/unlock.ts"

// Main entry point for the gitgame CLI tool.
await new Command()
    .name("gitgame")
    .version("0.1.0")
    .description("Git + LFS workflow tool for Unreal Engine projects")
    // ---
    //.command("submit", submitCommand)
    .command("lock", lockCommand)
    //.command("unlock", unlockCommand)
    //.command("status", statusCommand)
    //.command("pull", pullCommand)
    // ---
    .parse(Deno.args)
