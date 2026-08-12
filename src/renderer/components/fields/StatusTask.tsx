import { useStatusContext } from "@renderer/components/contexts/Status"
import STATUS_CONFIG from "@renderer/config/status"
import { useEffect, useMemo, useState } from "react"
import StatusBarFrame from "@/renderer/components/frames/StatusBar"
import TileProgressBar from "@/renderer/components/ui/TileProgressBar"

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

    // Cycle the tick while the task is indeterminate so the React95 bar animates
    useEffect(() => {
        if (!currentTask || currentTask.progress != null) return

        const id = window.setInterval(() => {
            setTick(previous => (previous + STATUS_CONFIG.indeterminateTickStep) % 100)
        }, STATUS_CONFIG.indeterminateTickMs)

        return () => window.clearInterval(id)
    }, [currentTask])

    if (!currentTask) return null

    return (
        <StatusBarFrame
            label={currentTask.label}
            labelState={tasks.length === 0 ? "muted" : "default"}
            className={className}
        >
            <TileProgressBar value={value} hideValue={currentTask.progress == null} />
        </StatusBarFrame>
    )
}
