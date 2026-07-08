import { cn } from "@cybearl/cypack/frontend"
import WORKSPACE_CONFIG from "@renderer/config/workspace"
import useDebouncedValue from "@renderer/hooks/useDebouncedValue"
import { type ChangeEvent, type CSSProperties, useCallback, useState } from "react"
import { TextInput } from "react95"
import TreeView from "@/renderer/components/views/Tree"

type FilesPaneProps = {
    selected: string | undefined
    onSelect: (id: string) => void
    className?: string
    style?: CSSProperties
}

export default function FilesPane({ selected, onSelect, className, style }: FilesPaneProps) {
    const [query, setQuery] = useState("")

    /**
     * The debounced query passed to the tree filter, so the expensive filter and
     * re-render only run once the user pauses typing.
     */
    const debouncedQuery = useDebouncedValue(query, WORKSPACE_CONFIG.searchDebounceMs)

    /**
     * Updates the query as the user types in the search input.
     * @param event The change event from the input.
     */
    const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value)
    }, [])

    return (
        <div className={cn("flex min-h-0 flex-col overflow-hidden", className)} style={style}>
            <div className="min-h-0 flex-1">
                <TreeView selected={selected} onSelect={onSelect} query={debouncedQuery} />
            </div>

            <div className="shrink-0 p-1">
                <TextInput
                    fullWidth
                    placeholder="Search files..."
                    className="select-none"
                    value={query}
                    onChange={handleQueryChange}
                />
            </div>
        </div>
    )
}
