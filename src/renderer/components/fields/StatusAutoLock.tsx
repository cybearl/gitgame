import lockIcon from "@react95-icons/Lock_16x16_4.png"
import useAutoLockState from "@renderer/hooks/useAutoLockState"
import { buildAutoLockFailuresDetails, buildAutoLockLabel, computeAutoLockProgress } from "@renderer/lib/utils/autoLock"
import { useCallback, useEffect, useMemo, useState } from "react"
import StatusBarFrame, { type StatusBarLabelState } from "@/renderer/components/frames/StatusBar"
import TileProgressBar from "@/renderer/components/ui/TileProgressBar"
import CONSTANTS from "@/renderer/lib/constants"

type StatusAutoLockFieldProps = {
    className?: string
}

export default function StatusAutoLockField({ className }: StatusAutoLockFieldProps) {
    const state = useAutoLockState()

    const [now, setNow] = useState(() => Date.now())

    /**
     * The chip label built from the current auto-lock state, `null` while the
     * first read has not landed yet so nothing renders on mount.
     */
    const label = useMemo(() => (state ? buildAutoLockLabel(state) : null), [state])

    /**
     * The tone the label takes.
     */
    const labelState = useMemo<StatusBarLabelState>(() => {
        if (state?.isReconciling) return "pending"
        return state?.failures.length ? "muted" : "default"
    }, [state?.isReconciling, state?.failures.length])

    /**
     * The countdown bar's fill, expressed as a 0-100 percentage of the elapsed
     * fraction of the tick interval since the last reconcile landed.
     */
    const progress = useMemo(() => (state ? computeAutoLockProgress(state, now) : 0), [state, now])

    /**
     * Handles a chip click.
     */
    const handleClick = useCallback(() => {
        if (!state) return

        if (state.failures.length > 0) {
            window.api.dialogs.errorWithDetails(
                "Auto-lock: some files couldn't be locked",
                `${state.failures.length} file${state.failures.length === 1 ? "" : "s"} failed during the last reconcile.`,
                buildAutoLockFailuresDetails(state.failures),
            )
            return
        }

        if (state.dir) window.api.autoLock.reconcile(state.dir)
    }, [state])

    // Re-sample "now" on a short interval so the bar fills smoothly between ticks
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), CONSTANTS.STATUS_BAR_TICK_MS)
        return () => window.clearInterval(id)
    }, [])

    if (!state?.enabled || !label) return null

    return (
        <StatusBarFrame
            icon={lockIcon}
            label={`Auto-lock [${label}]`}
            labelState={labelState}
            className={className}
            onClick={handleClick}
        >
            <TileProgressBar value={progress} isMuted={state.failures.length > 0} />
        </StatusBarFrame>
    )
}
