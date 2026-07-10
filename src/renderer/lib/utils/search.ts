import picomatch from "picomatch"
import type { FileTreeNode } from "@/main/types/fileTree"
import type { AppPreferences } from "@/main/types/store"

/**
 * The user-facing search filters applied on top of the file tree.
 */
export type SearchFilters = {
    query: string
    isRegex: boolean
    include: string[]
    exclude: string[]
}

/**
 * Parses a comma-separated pattern list into an array of trimmed, non-empty
 * patterns, so the raw text from the include/exclude inputs can be handed
 * straight to picomatch.
 * @param input The raw text from an include/exclude input.
 * @returns The parsed pattern list.
 */
export function parsePatternList(input: string): string[] {
    return input
        .split(",")
        .map(pattern => pattern.trim())
        .filter(pattern => pattern.length > 0)
}

/**
 * Compiles a query string into a name-testing predicate, honoring the current
 * mode, invalid regex patterns yield a never-matching predicate so a typo in the
 * input does not throw at render time.
 * @param query The query string.
 * @param isRegex Whether to interpret the query as a regular expression.
 * @returns The name predicate, or `null` when the query is empty.
 */
function compileQueryMatcher(query: string, isRegex: boolean): ((name: string) => boolean) | null {
    const needle = query.trim()
    if (!needle) return null

    if (isRegex) {
        try {
            const pattern = new RegExp(needle, "i")
            return name => pattern.test(name)
        } catch {
            return () => false
        }
    }

    const lower = needle.toLowerCase()
    return name => name.toLowerCase().includes(lower)
}

/**
 * Compiles a list of glob patterns into a single OR-matching path predicate.
 * @param patterns The glob pattern list.
 * @returns The path predicate, or `null` when the list is empty.
 */
function compileGlobList(patterns: string[]): ((path: string) => boolean) | null {
    if (patterns.length === 0) return null

    const matcher = picomatch(patterns, { dot: true })
    return path => matcher(path)
}

/**
 * Collects every file node that matches the given search filters, returned as a
 * flat list in depth-first order so the search UI can render results without
 * any surrounding folder chrome.
 * @param nodes The root-level file tree nodes.
 * @param filters The search filters.
 * @returns The matching file nodes.
 */
export function collectMatchingFiles(nodes: FileTreeNode[], filters: SearchFilters): FileTreeNode[] {
    const matchesQuery = compileQueryMatcher(filters.query, filters.isRegex)
    if (!matchesQuery) return []

    const matchesInclude = compileGlobList(filters.include)
    const matchesExclude = compileGlobList(filters.exclude)

    const results: FileTreeNode[] = []

    /**
     * Recursively visits a node, pushing matching files onto the result list.
     * @param node The node to visit.
     */
    const visit = (node: FileTreeNode) => {
        if (node.type === "file") {
            if (!matchesQuery(node.name)) return
            if (matchesInclude && !matchesInclude(node.path)) return
            if (matchesExclude?.(node.path)) return

            results.push(node)
            return
        }

        for (const child of node.children ?? []) visit(child)
    }

    for (const node of nodes) visit(node)

    return results
}

/**
 * Persists a subset of the search preferences without awaiting the result, so
 * the UI stays responsive; failures are logged but do not surface.
 * @param patch The preference fields to persist.
 */
export function persistSearchPreferences(patch: Partial<AppPreferences>) {
    window.api.projects.setPreferences(patch).catch(error => {
        console.error("Failed to persist search preferences:", error)
    })
}
