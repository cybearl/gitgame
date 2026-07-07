import { cn } from "@cybearl/cypack/frontend"
import TreeView from "@renderer/components/ui/treeView"
import type { CSSProperties } from "react"

type FilesPaneProps = {
    selected: string | undefined
    onSelect: (id: string) => void
    className?: string
    style?: CSSProperties
}

export default function FilesPane({ selected, onSelect, className, style }: FilesPaneProps) {
    return (
        <div className={cn("flex min-h-0 flex-col overflow-hidden", className)} style={style}>
            <TreeView selected={selected} onSelect={onSelect} />
        </div>
    )
}
