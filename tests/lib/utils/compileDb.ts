import type { CompileDbFileKind } from "@/main/types/compileDb"

/**
 * Builds a scan result from a list of path and kind pairs, so a test can state the
 * file set it cares about inline instead of walking a fixture tree on disk.
 * @param entries The pairs to build the scan result from.
 * @returns The scan result.
 */
export function buildScan(entries: [string, CompileDbFileKind][]): Map<string, CompileDbFileKind> {
    return new Map(entries)
}
