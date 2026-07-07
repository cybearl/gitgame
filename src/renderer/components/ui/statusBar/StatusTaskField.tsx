import { cn } from "@cybearl/cypack/frontend"
import { useStatusContext } from "@renderer/components/contexts/Status"
import STATUS_CONFIG from "@renderer/config/status"
import { useEffect, useMemo, useState } from "react"
import { Frame, ProgressBar } from "react95"
import Tooltip from "@/renderer/components/ui/Tooltip"

type StatusTaskFieldProps = {
    className?: string
}

export default function StatusTaskField({ className }: StatusTaskFieldProps) {
    const [tick, setTick] = useState(0)

    const { tasks } = useStatusContext()

    /**
     * The currently running task, which is the last one in the stack.
     */
    const currentTask = useMemo(() => {
        return tasks.length > 0
            ? tasks[tasks.length - 1]
            : {
                  id: STATUS_CONFIG.disabledTask.id,
                  label: STATUS_CONFIG.disabledTask.label,
                  progress: 0,
              }
    }, [tasks])

    /**
     * The value passed to the bar, cycled from the local tick when the task is
     * indeterminate and clamped from the task's own progress otherwise.
     */
    const value = useMemo(() => {
        if (currentTask?.progress == null) return tick
        return Math.max(0, Math.min(100, currentTask.progress))
    }, [currentTask?.progress, tick])

    // Cycle the tick while the task is indeterminate so the react95 bar animates
    useEffect(() => {
        if (!currentTask || currentTask.progress != null) return

        const id = window.setInterval(() => {
            setTick(previous => (previous + STATUS_CONFIG.indeterminateTickStep) % 100)
        }, STATUS_CONFIG.indeterminateTickMs)

        return () => window.clearInterval(id)
    }, [currentTask])

    if (!currentTask) return null

    return (
        <Frame
            variant="status"
            className={cn("flex items-center gap-2 px-2 py-0.5 text-xs min-w-48 max-w-1/2 overflow-hidden", className)}
        >
            <div className="min-w-0 flex-1">
                <span className={cn("block truncate select-none", tasks.length === 0 && "opacity-50")}>
                    {currentTask.label}
                </span>
            </div>

            <ProgressBar
                variant="tile"
                value={value}
                hideValue={currentTask.progress == null}
                className="w-24 shrink-0 h-8!"
            />
        </Frame>
    )
}
