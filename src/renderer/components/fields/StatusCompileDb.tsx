import batExecIcon from "@react95-icons/BatExec_16x16_4.png"
import useCompileDbState from "@renderer/hooks/useCompileDbState"
import { buildCompileDbFailureDetails, buildCompileDbLabel } from "@renderer/lib/utils/compileDb"
import { useCallback, useEffect, useMemo, useState } from "react"
import StatusBarFrame, { type StatusBarLabelState } from "@/renderer/components/frames/StatusBar"
import TileProgressBar from "@/renderer/components/ui/TileProgressBar"
import STATUS_CONFIG from "@/renderer/config/status"

type StatusCompileDbFieldProps = {
    className?: string
}

export default function StatusCompileDbField({ className }: StatusCompileDbFieldProps) {
    const state = useCompileDbState()

    const [tick, setTick] = useState(0)

    /**
     * Whether the last regeneration failed.
     */
    const hasFailed = Boolean(state?.lastError || state?.lastResult?.ok === false)

    /**
     * The chip label built from the current watcher state, `null` while the first
     * read has not landed yet so nothing renders on mount.
     */
    const label = useMemo(() => (state ? buildCompileDbLabel(state) : null), [state])

    /**
     * Whether the chip has anything worth taking a slot in the status bar for, a
     * blueprint-only project has no database to keep up to date, and a project the
     * watcher is off for only earns a slot once something has run by hand.
     */
    const isVisible = useMemo(() => {
        if (!state) return false
        if (state.isRunning || state.lastResult || state.lastError) return true

        return state.enabled && state.trackedFileCount > 0
    }, [state])

    /**
     * The tone the label takes.
     */
    const labelState = useMemo<StatusBarLabelState>(() => {
        if (state?.isRunning) return "pending"
        return hasFailed || !state?.enabled ? "muted" : "default"
    }, [state?.isRunning, state?.enabled, hasFailed])

    /**
     * Handles a chip click, surfaces the failure when there is one to read and
     * regenerates the database on demand otherwise.
     */
    const handleClick = useCallback(() => {
        if (!state) return

        if (hasFailed) {
            window.api.dialogs.errorWithDetails(
                "Compile database: the last regeneration failed",
                state.lastError ?? "The engine's build tool exited with an error.",
                buildCompileDbFailureDetails(state),
            )

            return
        }

        window.api.compileDb.regenerate("fast")
    }, [state, hasFailed])

    // Cycle the tick while a run is in flight, it has no interval to count down
    // against so the bar can only ever be indeterminate
    useEffect(() => {
        if (!state?.isRunning) return

        const id = window.setInterval(() => {
            setTick(previous => (previous + STATUS_CONFIG.indeterminateTickStep) % 100)
        }, STATUS_CONFIG.indeterminateTickMs)

        return () => window.clearInterval(id)
    }, [state?.isRunning])

    if (!state?.dir || !label || !isVisible) return null

    return (
        <StatusBarFrame
            icon={batExecIcon}
            label={`C++ DB [${label}]`}
            labelState={labelState}
            className={className}
            onClick={handleClick}
        >
            <TileProgressBar value={state.isRunning ? tick : 0} isMuted={hasFailed} hideValue />
        </StatusBarFrame>
    )
}
