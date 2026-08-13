import { execFile } from "node:child_process"
import { promisify } from "node:util"
import COMPILE_DB_CONFIG from "@main/config/compileDb"
import CONSTANTS from "@main/lib/constants"
import type { CompileDbContext, CompileDbRunKind, CompileDbRunResult } from "@/main/types/compileDb"

/**
 * Promisified version of `child_process.execFile`.
 */
const execFileAsync = promisify(execFile)

/**
 * A single build-tool invocation, the label is what the status field names while
 * the invocation is in flight and what a failure is reported against.
 */
type CompileDbStep = {
    label: string
    args: string[]
}

/**
 * Keeps the tail of a block of output, taken from the end because the build tool
 * puts the reason it failed there, and marks the cut so a truncated log does not
 * read as a complete one.
 * @param text The output to trim.
 * @returns The trimmed output.
 */
function trimTail(text: string): string {
    const trimmed = text.trim()
    if (trimmed.length <= COMPILE_DB_CONFIG.maxOutputChars) return trimmed

    return `[...]\n${trimmed.slice(-COMPILE_DB_CONFIG.maxOutputChars)}`
}

/**
 * Folds an invocation's two streams into the one block the details dialog shows,
 * the build tool writes its progress to stdout and its diagnostics to stderr and
 * both matter when a run fails.
 * @param stdout The captured standard output.
 * @param stderr The captured standard error.
 * @returns The combined and trimmed output.
 */
function combineOutput(stdout: string, stderr: string): string {
    return trimTail(`${stdout}${stderr}`)
}

/**
 * Quotes an argument that carries whitespace, so a project living under a path
 * with a space in it survives the trip through the Windows command interpreter.
 * @param arg The argument to quote.
 * @returns The argument, quoted when it needs to be.
 */
function quoteForShell(arg: string): string {
    return /\s/.test(arg) ? `"${arg}"` : arg
}

/**
 * Builds the command an invocation actually goes through, a `.bat` cannot be
 * executed directly so on Windows the command line is handed to the command
 * interpreter, whose `/s` strips the outer pair of quotes back off.
 * @param context The resolved engine, project and target the run is bound to.
 * @param args The build-tool arguments for this invocation.
 * @returns The command, its arguments, and whether they are already quoted.
 */
function buildInvocation(
    context: CompileDbContext,
    args: string[],
): { command: string; args: string[]; isVerbatim: boolean } {
    if (process.platform !== "win32") {
        return {
            command: context.buildScriptPath,
            args,
            isVerbatim: false,
        }
    }

    const commandLine = [context.buildScriptPath, ...args].map(quoteForShell).join(" ")

    return {
        command: process.env.ComSpec ?? "cmd.exe",
        args: ["/d", "/s", "/c", `"${commandLine}"`],
        isVerbatim: true,
    }
}

/**
 * Runs one build-tool invocation and captures how it went, a non-zero exit is
 * reported rather than thrown so the caller can attribute it to its step.
 * @param context The resolved engine, project and target the run is bound to.
 * @param step The invocation to run.
 * @returns The exit code and the trimmed output.
 * @throws When the build script cannot be spawned at all.
 */
async function runStep(context: CompileDbContext, step: CompileDbStep): Promise<{ exitCode: number; output: string }> {
    const { command, args, isVerbatim } = buildInvocation(context, step.args)

    try {
        const { stdout, stderr } = await execFileAsync(command, args, {
            cwd: context.projectRoot,
            windowsHide: true,
            windowsVerbatimArguments: isVerbatim,
            timeout: COMPILE_DB_CONFIG.stepTimeoutMs,
            maxBuffer: COMPILE_DB_CONFIG.maxOutputBufferSize,
        })

        return { exitCode: 0, output: combineOutput(stdout, stderr) }
    } catch (error) {
        const typedError = error as NodeJS.ErrnoException & {
            stdout?: string
            stderr?: string
            code?: number | string
            killed?: boolean
        }

        // A build script that cannot be spawned surfaces as a spawn error with a
        // string code (e.g "ENOENT"), which is a broken engine install rather than
        // a failed generation
        if (typeof typedError.code === "string") {
            throw new Error(`${CONSTANTS.compileDb.spawnFailureMessage} (${typedError.code})\n\n${command}`)
        }

        const exitCode = typeof typedError.code === "number" ? typedError.code : 1
        const output = combineOutput(typedError.stdout ?? "", typedError.stderr ?? "")

        if (typedError.killed) {
            return { exitCode, output: `${CONSTANTS.compileDb.timedOutMessage}\n\n${output}` }
        }

        return { exitCode, output }
    }
}

/**
 * Builds the invocation that regenerates the Visual Studio solution.
 * @param context The resolved engine, project and target the run is bound to.
 * @returns The invocation.
 */
function buildSolutionStep(context: CompileDbContext): CompileDbStep {
    return {
        label: "Solution",
        args: ["-projectfiles", `-project=${context.uprojectPath}`, "-game", "-engine"],
    }
}

/**
 * Builds the invocation that regenerates the editor workspace.
 * @param context The resolved engine, project and target the run is bound to.
 * @returns The invocation.
 */
function buildWorkspaceStep(context: CompileDbContext): CompileDbStep {
    return {
        label: "Workspace",
        args: ["-projectfiles", "-vscode", `-project=${context.uprojectPath}`, "-game", "-engine"],
    }
}

/**
 * Builds the invocation that regenerates the clangd compile database, the only
 * one of the three a new or removed source file actually needs.
 * @param context The resolved engine, project and target the run is bound to.
 * @returns The invocation.
 */
function buildClangDatabaseStep(context: CompileDbContext): CompileDbStep {
    return {
        label: "Database",
        args: [
            COMPILE_DB_CONFIG.clangDatabaseMode,
            `-project=${context.uprojectPath}`,
            context.target,
            context.targetPlatform,
            COMPILE_DB_CONFIG.configuration,
            "-game",
            // Without this the build tool writes the database into the engine
            // install rather than into the project
            `-OutputDir=${context.projectRoot}`,
        ],
    }
}

/**
 * Builds the invocations a run performs, the fast path touches the compile
 * database alone while the full one regenerates the solution and the workspace
 * ahead of it, in that order, because the database is what clangd reads back.
 * @param kind Which regeneration to perform.
 * @param context The resolved engine, project and target the run is bound to.
 * @returns The invocations to run in order.
 */
function buildSteps(kind: CompileDbRunKind, context: CompileDbContext): CompileDbStep[] {
    if (kind === "fast") return [buildClangDatabaseStep(context)]
    return [buildSolutionStep(context), buildWorkspaceStep(context), buildClangDatabaseStep(context)]
}

/**
 * Runs a regeneration end to end, stopping at the first invocation that exits
 * non-zero so a broken solution step cannot be followed by a database written
 * against it.
 * @param kind Which regeneration to perform.
 * @param context The resolved engine, project and target the run is bound to.
 * @param onStep Called with each invocation's label as it starts.
 * @returns The outcome of the run.
 * @throws When a build script cannot be spawned at all.
 */
export async function runRegeneration(
    kind: CompileDbRunKind,
    context: CompileDbContext,
    onStep: (label: string) => void,
): Promise<CompileDbRunResult> {
    const startedAt = Date.now()
    const outputs: string[] = []

    for (const step of buildSteps(kind, context)) {
        onStep(step.label)

        const { exitCode, output } = await runStep(context, step)
        outputs.push(`--- ${step.label} ---\n${output}`)

        if (exitCode !== 0) {
            return {
                kind,
                ok: false,
                exitCode,
                failedStep: step.label,
                output: trimTail(outputs.join("\n\n")),
                durationMs: Date.now() - startedAt,
            }
        }
    }

    return {
        kind,
        ok: true,
        exitCode: 0,
        failedStep: null,
        output: trimTail(outputs.join("\n\n")),
        durationMs: Date.now() - startedAt,
    }
}
