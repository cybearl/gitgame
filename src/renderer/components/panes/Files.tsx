import { cn } from "@cybearl/cypack/frontend"
import lockIcon from "@react95-icons/Lock_16x16_4.png"
import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import { type ChangeEvent, type CSSProperties, useCallback } from "react"
import { Button, TextInput } from "react95"
import TreeView from "@/renderer/components/views/Tree"

type FilesPaneProps = {
    className?: string
    style?: CSSProperties
}

export default function FilesPane({ className, style }: FilesPaneProps) {
    const {
        query,
        isRegex,
        isAdvancedOpen,
        includeText,
        excludeText,
        isShowingMyLocksOnly,
        matches,
        isSearching,
        setQuery,
        setIsRegex,
        setIsAdvancedOpen,
        setIncludeText,
        setExcludeText,
        setIsShowingMyLocksOnly,
        commitIncludeText,
        commitExcludeText,
    } = useTreeViewContext()

    /**
     * Updates the query as the user types in the search input.
     * @param event The change event from the input.
     */
    const handleQueryChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setQuery(event.target.value)
        },
        [setQuery],
    )

    /**
     * Updates the include-globs input as the user types.
     * @param event The change event from the input.
     */
    const handleIncludeChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setIncludeText(event.target.value)
        },
        [setIncludeText],
    )

    /**
     * Updates the exclude-globs input as the user types.
     * @param event The change event from the input.
     */
    const handleExcludeChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setExcludeText(event.target.value)
        },
        [setExcludeText],
    )

    /**
     * Toggles the regex interpretation of the query.
     */
    const toggleRegex = useCallback(() => {
        setIsRegex(!isRegex)
    }, [isRegex, setIsRegex])

    /**
     * Toggles the visibility of the advanced include/exclude fields.
     */
    const toggleAdvanced = useCallback(() => {
        setIsAdvancedOpen(!isAdvancedOpen)
    }, [isAdvancedOpen, setIsAdvancedOpen])

    /**
     * Toggles the "show only my locks" filter, pruning the tree to files the
     * current user has locked (plus their ancestor folders).
     */
    const toggleShowingMyLocksOnly = useCallback(() => {
        setIsShowingMyLocksOnly(!isShowingMyLocksOnly)
    }, [isShowingMyLocksOnly, setIsShowingMyLocksOnly])

    return (
        <div className={cn("flex min-h-0 flex-col overflow-hidden", className)} style={style}>
            <div className="min-h-0 flex-1">
                <TreeView />
            </div>

            {isSearching && matches && (
                <div className="shrink-0 pt-1.5 pl-1 text-xs select-none">
                    {matches.length} {matches.length === 1 ? "match" : "matches"}
                </div>
            )}

            <div className="flex shrink-0 flex-col gap-1 p-1">
                <div className="flex items-center gap-1">
                    <TextInput
                        fullWidth
                        placeholder="Search files..."
                        className="select-none"
                        value={query}
                        onChange={handleQueryChange}
                    />
                    <Button
                        square
                        active={isRegex}
                        onClick={toggleRegex}
                        aria-label="Use regular expression"
                        title="Use regular expression"
                    >
                        .*
                    </Button>
                    <Button
                        square
                        active={isAdvancedOpen}
                        onClick={toggleAdvanced}
                        aria-label="Toggle files to include/exclude"
                        title="Toggle files to include/exclude"
                    >
                        ...
                    </Button>
                    <Button
                        square
                        active={isShowingMyLocksOnly}
                        onClick={toggleShowingMyLocksOnly}
                        aria-label="Show only files I have locked"
                        title="Show only files I have locked"
                    >
                        <img
                            src={lockIcon}
                            alt=""
                            decoding="sync"
                            fetchPriority="high"
                            className="size-4 [image-rendering:pixelated]"
                        />
                    </Button>
                </div>

                {isAdvancedOpen && (
                    <>
                        <TextInput
                            fullWidth
                            placeholder="files to include (e.g. **/*.ts)"
                            className="select-none"
                            value={includeText}
                            onChange={handleIncludeChange}
                            onBlur={commitIncludeText}
                        />

                        <TextInput
                            fullWidth
                            placeholder="files to exclude (e.g. **/node_modules/**)"
                            className="select-none"
                            value={excludeText}
                            onChange={handleExcludeChange}
                            onBlur={commitExcludeText}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
