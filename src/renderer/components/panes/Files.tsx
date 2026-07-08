import { cn } from "@cybearl/cypack/frontend"
import { useTreeContext } from "@renderer/components/contexts/Tree"
import WORKSPACE_CONFIG from "@renderer/config/workspace"
import useDebouncedValue from "@renderer/hooks/useDebouncedValue"
import {
    collectMatchingFiles,
    parsePatternList,
    persistSearchPreferences,
    type SearchFilters,
} from "@renderer/lib/utils/search"
import { type ChangeEvent, type CSSProperties, useCallback, useEffect, useMemo, useState } from "react"
import { Button, TextInput } from "react95"
import TreeView from "@/renderer/components/views/Tree"

type FilesPaneProps = {
    selected: string | undefined
    onSelect: (id: string) => void
    className?: string
    style?: CSSProperties
}

export default function FilesPane({ selected, onSelect, className, style }: FilesPaneProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isRegexSearchQuery, setIsRegexSearchQuery] = useState(false)

    const [isAdvancedSearchOpened, setIsAdvancedSearchOpened] = useState(false)

    const [searchIncludePatterns, setSearchIncludePatterns] = useState("")
    const [searchExcludePatterns, setSearchExcludePatterns] = useState("")

    const { fileTree } = useTreeContext()

    // Hydrate the persisted search preferences once on mount, so the search
    // scope survives across sessions
    useEffect(() => {
        let cancelled = false

        window.api.project
            .getPreferences()
            .then(preferences => {
                if (cancelled) return

                setIsRegexSearchQuery(preferences.searchIsRegex)
                setIsAdvancedSearchOpened(preferences.isAdvancedSearchOpened)
                setSearchIncludePatterns(preferences.searchIncludePatterns)
                setSearchExcludePatterns(preferences.searchExcludePatterns)
            })
            .catch(error => {
                console.error("Failed to load search preferences:", error)
            })

        return () => {
            cancelled = true
        }
    }, [])

    /**
     * The debounced filter inputs, so the expensive filter and re-render only
     * run once the user pauses typing in any of them.
     */
    const debouncedQuery = useDebouncedValue(searchQuery, WORKSPACE_CONFIG.searchDebounceMs)
    const debouncedInclude = useDebouncedValue(searchIncludePatterns, WORKSPACE_CONFIG.searchDebounceMs)
    const debouncedExclude = useDebouncedValue(searchExcludePatterns, WORKSPACE_CONFIG.searchDebounceMs)

    /**
     * The compiled search filters, rebuilt whenever any debounced input or the
     * regex toggle changes.
     */
    const filters = useMemo<SearchFilters>(
        () => ({
            query: debouncedQuery,
            isRegex: isRegexSearchQuery,
            include: parsePatternList(debouncedInclude),
            exclude: parsePatternList(debouncedExclude),
        }),
        [debouncedQuery, isRegexSearchQuery, debouncedInclude, debouncedExclude],
    )

    const isSearching = filters.query.trim().length > 0

    /**
     * The flat list of files matching the current filters, or `null` when the
     * user is not searching so the tree view keeps its full hierarchy.
     */
    const matches = useMemo(
        () => (isSearching ? collectMatchingFiles(fileTree, filters) : null),
        [isSearching, fileTree, filters],
    )

    /**
     * Updates the searchQuery as the user types in the search input.
     * @param event The change event from the input.
     */
    const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value)
    }, [])

    /**
     * Updates the include-globs input as the user types.
     * @param event The change event from the input.
     */
    const handleIncludeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSearchIncludePatterns(event.target.value)
    }, [])

    /**
     * Updates the exclude-globs input as the user types.
     * @param event The change event from the input.
     */
    const handleExcludeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSearchExcludePatterns(event.target.value)
    }, [])

    /**
     * Persists the include-globs input on blur so cross-session state matches
     * whatever the user last committed.
     * @param event The blur event from the input.
     */
    const handleIncludeBlur = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        persistSearchPreferences({ searchIncludePatterns: event.target.value })
    }, [])

    /**
     * Persists the exclude-globs input on blur so cross-session state matches
     * whatever the user last committed.
     * @param event The blur event from the input.
     */
    const handleExcludeBlur = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        persistSearchPreferences({ searchExcludePatterns: event.target.value })
    }, [])

    /**
     * Toggles the regex interpretation of the searchQuery and persists it.
     */
    const toggleRegex = useCallback(() => {
        setIsRegexSearchQuery(previous => {
            const next = !previous
            persistSearchPreferences({ searchIsRegex: next })
            return next
        })
    }, [])

    /**
     * Toggles the visibility of the advanced include/exclude fields and persists
     * the preference.
     */
    const toggleAdvanced = useCallback(() => {
        setIsAdvancedSearchOpened(previous => {
            const next = !previous
            persistSearchPreferences({ isAdvancedSearchOpened: next })
            return next
        })
    }, [])

    return (
        <div className={cn("flex min-h-0 flex-col overflow-hidden", className)} style={style}>
            <div className="min-h-0 flex-1">
                <TreeView selected={selected} onSelect={onSelect} matches={matches} />
            </div>

            {isSearching && matches && (
                <div className="shrink-0 px-2 py-0.5 text-xs opacity-70 select-none">
                    {matches.length} {matches.length === 1 ? "match" : "matches"}
                </div>
            )}

            <div className="flex shrink-0 flex-col gap-1 p-1">
                <div className="flex items-center gap-1">
                    <TextInput
                        fullWidth
                        placeholder="Search files..."
                        className="select-none"
                        value={searchQuery}
                        onChange={handleQueryChange}
                    />
                    <Button
                        square
                        active={isRegexSearchQuery}
                        onClick={toggleRegex}
                        aria-label="Use regular expression"
                        title="Use regular expression"
                    >
                        .*
                    </Button>
                    <Button
                        square
                        active={isAdvancedSearchOpened}
                        onClick={toggleAdvanced}
                        aria-label="Toggle files to include/exclude"
                        title="Toggle files to include/exclude"
                    >
                        ...
                    </Button>
                </div>

                {isAdvancedSearchOpened && (
                    <>
                        <TextInput
                            fullWidth
                            placeholder="files to include (e.g. **/*.ts)"
                            className="select-none"
                            value={searchIncludePatterns}
                            onChange={handleIncludeChange}
                            onBlur={handleIncludeBlur}
                        />

                        <TextInput
                            fullWidth
                            placeholder="files to exclude (e.g. **/node_modules/**)"
                            className="select-none"
                            value={searchExcludePatterns}
                            onChange={handleExcludeChange}
                            onBlur={handleExcludeBlur}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
