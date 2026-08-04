import { cn } from "@cybearl/cypack/frontend"
import lockIcon from "@react95-icons/Lock_16x16_4.png"
import Icon from "@renderer/components/ui/Icon"
import TileProgressBar from "@renderer/components/ui/TileProgressBar"
import useAutoLockState from "@renderer/hooks/useAutoLockState"
import { buildAutoLockFailuresDetails, buildAutoLockLabel, computeAutoLockProgress } from "@renderer/lib/utils/autoLock"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Frame } from "react95"
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
     * The countdown bar's fill, expressed as a 0-100 percentage of the elapsed
     * fraction of the tick interval since the last reconcile landed.
     */
    const progress = useMemo(() => (state ? computeAutoLockProgress(state, now) : 0), [state, now])

    /**
     * Handles a chip click, opens the failures dialog when the last reconcile
     * left some files unlocked or unreleased, forces an immediate reconcile
     * otherwise so a manual click always does something useful.
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

    // Re-sample "now" on a short interval so the bar fills smoothly between
    // ticks, the state itself only broadcasts on transitions and cannot drive
    // the animation
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), CONSTANTS.STATUS_BAR_TICK_MS)
        return () => window.clearInterval(id)
    }, [])

    if (!state?.enabled || !label) return null

    const hasErrors = state.failures.length > 0

    return (
        <Frame
            variant="status"
            className={cn(
                "flex items-center gap-2 p-2 text-xs min-w-48 max-w-1/2 overflow-hidden cursor-pointer",
                className,
            )}
            onClick={handleClick}
        >
            <div className="min-w-0 flex-1 flex items-center pb-1">
                <Icon src={lockIcon} isInline className={cn(state.isReconciling && "animate-pulse")} />
                <span className={cn("block truncate select-none", hasErrors && "opacity-60")}>Auto-lock [{label}]</span>
            </div>

            <TileProgressBar value={progress} muted={hasErrors} />
        </Frame>
    )
}
