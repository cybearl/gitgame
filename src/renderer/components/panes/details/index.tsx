import { cn } from "@cybearl/cypack/frontend"
import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import NodeSection from "@renderer/components/panes/details/NodeSection"
import ProjectSection from "@renderer/components/panes/details/ProjectSection"
import DetailsToolbar from "@renderer/components/panes/details/Toolbar"
import useSelectionLocks from "@renderer/hooks/useSelectionLocks"
import { ScrollView, Separator } from "react95"

type DetailsPaneProps = {
    className?: string
}

export default function DetailsPane({ className }: DetailsPaneProps) {
    const { selectedNode } = useTreeViewContext()
    const { lockablePaths, minePaths, othersPaths, lockSelection, unlockSelection, forceUnlockSelection } =
        useSelectionLocks()

    return (
        <div className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
            <DetailsToolbar
                lockablePaths={lockablePaths}
                minePaths={minePaths}
                othersPaths={othersPaths}
                onLock={lockSelection}
                onUnlock={unlockSelection}
                onForceUnlock={forceUnlockSelection}
            />

            <Separator />

            <ScrollView className="min-h-0 flex-1 [&>div]:relative [&>div]:z-10">
                <div className="p-3">
                    {selectedNode ? (
                        <NodeSection
                            node={selectedNode}
                            lockablePaths={lockablePaths}
                            minePaths={minePaths}
                            othersPaths={othersPaths}
                        />
                    ) : (
                        <ProjectSection />
                    )}
                </div>
            </ScrollView>
        </div>
    )
}
