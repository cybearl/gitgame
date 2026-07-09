import fileFindIcon from "@react95-icons/FileFind_32x32_4.png"
import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import WORKSPACE_CONFIG from "@renderer/config/workspace"
import { useMemo } from "react"
import { List } from "react-window"
import FlatResultsRow, { type FlatResultsRowData } from "@/renderer/components/rows/FlatResults"
import EmptyState from "@/renderer/components/ui/EmptyState"

export default function FlatResultsList() {
    const { matches } = useTreeViewContext()

    /**
     * The row props forwarded to every virtualized row, memoized so react-window
     * only re-renders rows when the underlying match list changes.
     */
    const rowProps = useMemo<FlatResultsRowData>(() => ({ matches: matches ?? [] }), [matches])

    if (!matches || matches.length === 0) {
        return <EmptyState icon={fileFindIcon} title="No matches" description="Try a different keyword." />
    }

    return (
        <List
            role="listbox"
            className="tree-scrollview"
            rowCount={matches.length}
            rowHeight={WORKSPACE_CONFIG.searchResultRowHeight}
            rowComponent={FlatResultsRow}
            rowProps={rowProps}
            style={{ height: "100%", width: "100%" }}
        />
    )
}
