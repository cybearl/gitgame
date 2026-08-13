/**
 * Which regeneration a run performed, `fast` for the clangd compile database on
 * its own and `full` for the solution and the editor workspace alongside it.
 */
export type CompileDbRunKind = "fast" | "full"

/**
 * What a file counts as inside a source tree, `source` for a translation unit or
 * header the compile database indexes, `descriptor` for a build or plugin
 * descriptor whose change can also move the solution.
 */
export type CompileDbFileKind = "source" | "descriptor"

/**
 * Everything a regeneration needs resolved before it can run, gathered once when
 * the watcher binds to a project so a change does not pay for the lookups again.
 */
export type CompileDbContext = {
    projectRoot: string
    uprojectPath: string
    engineRoot: string
    buildScriptPath: string
    target: string
    targetPlatform: string
}

/**
 * One complaint the build tool made about a source file, parsed out of its output
 * so a failure caused by the project's own C++ can be told apart from one caused
 * by GitGame or by the engine install, and reported as the diagnostic it is.
 */
export type CompileDbDiagnostic = {
    file: string
    line: number
    message: string
}

/**
 * The outcome of a single regeneration, `output` is the tail of the combined
 * streams, `failedStep` names which step of a `full` run gave up, and a non-empty
 * `diagnostics` marks the failure as the project's own rather than ours.
 */
export type CompileDbRunResult = {
    kind: CompileDbRunKind
    ok: boolean
    exitCode: number
    failedStep: string | null
    diagnostics: CompileDbDiagnostic[]
    output: string
    durationMs: number
}

/**
 * The compile-database watcher's observable state, broadcast to every open
 * window so the status chip and the menu items follow the same transitions the
 * watcher records.
 */
export type CompileDbState = {
    enabled: boolean
    dir: string | null
    engineRoot: string | null
    target: string | null
    isRunning: boolean
    runningStep: string | null
    isFullRegenSuggested: boolean
    trackedFileCount: number
    lastRunAt: string | null
    lastResult: CompileDbRunResult | null
    lastError: string | null
}
