import type { StatusTaskHandle } from "@renderer/components/contexts/Status"
import { useStatusContext } from "@renderer/components/contexts/Status"
import { useEffect, useRef } from "react"

/**
 * Mirrors a running update download onto the status bar, so its progress stays
 * visible once the update dialog has been dismissed.
 */
export default function useUpdaterStatusTask() {
    const { startTask } = useStatusContext()

    /**
     * The status bar task standing for the running download, if any.
     */
    const taskRef = useRef<StatusTaskHandle | null>(null)

    // Depends on `startTask` alone, which is stable, since the context value itself
    // changes on every task update and would otherwise tear the task down mid-download
    useEffect(() => {
        const unsubscribe = window.api.updater.onStateChange(state => {
            if (state.status === "downloading") {
                if (!taskRef.current) taskRef.current = startTask(`Downloading GitGame ${state.version}`)
                taskRef.current.setProgress(Math.round(state.progress?.percent ?? 0))

                return
            }

            if (taskRef.current) {
                taskRef.current.finish()
                taskRef.current = null
            }
        })

        return () => {
            unsubscribe()

            taskRef.current?.finish()
            taskRef.current = null
        }
    }, [startTask])
}
