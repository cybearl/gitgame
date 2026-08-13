import dedent from "dedent"
import type { CompileDbState } from "@/main/types/compileDb"

/**
 * Builds the short label shown in the status bar chip, names the step while a run
 * is in flight and settles on the outcome of the last one afterwards, every branch
 * kept inside the width the shared status frame gives it.
 * @param state The current compile-database state.
 * @returns The chip label.
 */
export function buildCompileDbLabel(state: CompileDbState): string {
    if (state.isRunning) return state.runningStep ?? "Running"
    if (state.lastError) return "Error"

    if (state.lastResult && !state.lastResult.ok) return "Failed"
    if (state.isFullRegenSuggested) return "Full regen"
    if (state.lastResult) return `${(state.lastResult.durationMs / 1000).toFixed(1)}s`

    return `${state.trackedFileCount} files`
}

/**
 * Builds the details block shown when the chip is clicked on a failure, pairs the
 * step that gave up with the tail of the build tool's own output.
 * @param state The current compile-database state.
 * @returns The formatted details block.
 */
export function buildCompileDbFailureDetails(state: CompileDbState): string {
    if (state.lastError) return state.lastError

    if (!state.lastResult) return "No further details available."

    return dedent`
        Step: ${state.lastResult.failedStep ?? "unknown"}
        Exit code: ${state.lastResult.exitCode}

        ${state.lastResult.output || "The build tool produced no output."}
    `
}
