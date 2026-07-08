import fileFindIcon from "@react95-icons/FileFind_32x32_4.png"
import WORKSPACE_CONFIG from "@renderer/config/workspace"
import { List } from "react-window"
import FlatResultsRow, { type FlatResultsRowData } from "@/renderer/components/rows/FlatResults"
import EmptyState from "@/renderer/components/ui/EmptyState"

export default function FlatResultsList(props: FlatResultsRowData) {
    if (props.matches.length === 0) {
        return <EmptyState icon={fileFindIcon} title="No matches" description="Try a different keyword." />
    }

    return (
        <List
            role="listbox"
            className="tree-scrollview"
            rowCount={props.matches.length}
            rowHeight={WORKSPACE_CONFIG.searchResultRowHeight}
            rowComponent={FlatResultsRow}
            rowProps={props}
            style={{ height: "100%", width: "100%" }}
        />
    )
}
