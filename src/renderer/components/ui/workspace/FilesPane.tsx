import { cn } from "@cybearl/cypack/frontend"
import TreeView from "@renderer/components/ui/treeView"
import { type ChangeEvent, type CSSProperties, useCallback, useState } from "react"
import { TextInput } from "react95"

type FilesPaneProps = {
    selected: string | undefined
    onSelect: (id: string) => void
    className?: string
    style?: CSSProperties
}

export default function FilesPane({ selected, onSelect, className, style }: FilesPaneProps) {
    const [query, setQuery] = useState("")

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
                <TreeView selected={selected} onSelect={onSelect} query={query} />
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
