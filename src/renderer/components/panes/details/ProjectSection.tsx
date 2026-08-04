import { useFileTreeContext } from "@renderer/components/contexts/FileTree"
import { useProjectContext } from "@renderer/components/contexts/Project"
import DetailsRow from "@renderer/components/panes/details/Row"
import { useMemo } from "react"
import { GroupBox } from "react95"
import { countLocksByOwnership } from "@/renderer/lib/utils/lockStates"

export default function ProjectSection() {
    const { currentProject } = useProjectContext()
    const { locksByPath } = useFileTreeContext()

    /**
     * The overall lock counts across the whole project, split between the
     * current user and others.
     */
    const { mine, others } = useMemo(() => countLocksByOwnership(locksByPath), [locksByPath])

    return (
        <GroupBox label="Project" className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 text-sm">
                <DetailsRow label="Name" value={currentProject?.name ?? "No project open"} />

                {currentProject?.path && <DetailsRow label="Path" value={currentProject.path} className="break-all" />}

                <DetailsRow label="Locked by you" value={mine} />
                <DetailsRow label="Locked by others" value={others} />
            </div>

            <div className="mt-2 text-xs opacity-60">Select a file or folder in the tree to see its lock details.</div>
        </GroupBox>
    )
}
