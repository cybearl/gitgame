import { cn } from "@cybearl/cypack/frontend"
import serverIcon from "@react95-icons/Nwnp32ServerIcon_16x16_4.png"
import Icon from "@renderer/components/ui/Icon"
import TileProgressBar from "@renderer/components/ui/TileProgressBar"
import useMcpState from "@renderer/hooks/useMcpState"
import { buildMcpStatusLabel, computeProbeProgress } from "@renderer/lib/utils/mcp"
import { useEffect, useMemo, useState } from "react"
import { Frame } from "react95"
import CONSTANTS from "@/renderer/lib/constants"

type StatusMcpFieldProps = {
    className?: string
}

export default function StatusMcpField({ className }: StatusMcpFieldProps) {
    const state = useMcpState()

    const [now, setNow] = useState(() => Date.now())

    /**
     * The chip label built from the current MCP state, `null` while the first
     * read has not landed yet so nothing renders on mount.
     */
    const label = useMemo(() => (state ? buildMcpStatusLabel(state) : null), [state])

    /**
     * The countdown bar's fill, expressed as a 0-100 percentage of the elapsed
     * fraction of the probe interval since the last probe landed.
     */
    const progress = useMemo(() => (state ? computeProbeProgress(state, now) : 0), [state, now])

    // Re-sample "now" on a short interval so the bar fills smoothly between probes,
    // the state itself only broadcasts on transitions and cannot drive the animation
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), CONSTANTS.STATUS_BAR_TICK_MS)
        return () => window.clearInterval(id)
    }, [])

    if (!state || !label) return null

    return (
        <Frame
            variant="status"
            className={cn("flex items-center gap-2 p-2 text-xs min-w-48 max-w-1/2 overflow-hidden", className)}
        >
            <div className="min-w-0 flex-1 flex items-center pb-1">
                <Icon
                    src={serverIcon}
                    isInline
                    className={cn(
                        state.status === "disconnected" && "opacity-50 grayscale",
                        state.status === "connecting" && "opacity-50 grayscale animate-pulse",
                    )}
                />
                <span className={cn("block truncate select-none", state?.status !== "connected" && "opacity-60")}>
                    MCP [{label}]
                </span>
            </div>

            <TileProgressBar value={progress} muted={state.status !== "connected"} />
        </Frame>
    )
}
