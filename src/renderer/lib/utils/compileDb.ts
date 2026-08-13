import type { CompileDbDiagnostic, CompileDbState } from "@/main/types/compileDb"

/**
 * Whether the last failure was the project's own C++ being refused rather than
 * GitGame or the engine install failing to run at all, which are worth telling
 * apart because only one of them is ours to answer for.
 * @param state The current compile-database state.
 * @returns True when the failure carries source diagnostics.
 */
export function hasSourceDiagnostics(state: CompileDbState): boolean {
    return Boolean(state.lastResult && !state.lastResult.ok && state.lastResult.diagnostics.length > 0)
}

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

    if (state.lastResult && !state.lastResult.ok) {
        return hasSourceDiagnostics(state) ? "Code error" : "Failed"
    }

    if (state.isFullRegenSuggested) return "Full regen"
    if (state.lastResult) return `${(state.lastResult.durationMs / 1000).toFixed(1)}s`

    return `${state.trackedFileCount} files`
}

/**
 * Builds the title of the dialog a failure opens, naming which side of the line
 * the failure fell on so the project's own C++ is never reported as ours.
 * @param state The current compile-database state.
 * @returns The dialog title.
 */
export function buildCompileDbFailureTitle(state: CompileDbState): string {
    if (hasSourceDiagnostics(state)) return "Compile database: C++ errors found"
    return "Compile database: regeneration failed"
}

/**
 * Builds the message line of the dialog a failure opens.
 * @param state The current compile-database state.
 * @returns The dialog message.
 */
export function buildCompileDbFailureMessage(state: CompileDbState): string {
    if (hasSourceDiagnostics(state)) {
        const { diagnostics } = state.lastResult ?? { diagnostics: [] }

        return `The engine's build tool ran but would not accept the project's sources, it reported ${diagnostics.length} problem${diagnostics.length === 1 ? "" : "s"}. The database is left as it was, and GitGame retries as soon as the sources change again.`
    }

    return state.lastError ?? "The engine's build tool exited with an error before writing the database."
}

/**
 * Formats the build tool's complaints one per block, path and line first so the
 * file can be opened straight from the dialog.
 * @param diagnostics The diagnostics from the failed run.
 * @returns The formatted block.
 */
function formatDiagnostics(diagnostics: CompileDbDiagnostic[]): string {
    return diagnostics.map(diagnostic => `${diagnostic.file}(${diagnostic.line})\n  ${diagnostic.message}`).join("\n\n")
}

/**
 * Builds the details block shown when the chip is clicked on a failure, the source
 * diagnostics on their own when the project's C++ was the problem, and the tail of
 * the build tool's own output when it was not.
 * @param state The current compile-database state.
 * @returns The formatted details block.
 */
export function buildCompileDbFailureDetails(state: CompileDbState): string {
    if (!state.lastResult) return state.lastError ?? "No further details available."

    if (hasSourceDiagnostics(state)) return formatDiagnostics(state.lastResult.diagnostics)

    return [
        `Step: ${state.lastResult.failedStep ?? "unknown"}`,
        `Exit code: ${state.lastResult.exitCode}`,
        "",
        state.lastResult.output || "The build tool produced no output.",
    ].join("\n")
}
