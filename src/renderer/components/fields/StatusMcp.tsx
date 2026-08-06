import serverIcon from "@react95-icons/Nwnp32ServerIcon_16x16_4.png"
import useMcpState from "@renderer/hooks/useMcpState"
import { buildMcpStatusLabel, computeProbeProgress } from "@renderer/lib/utils/mcp"
import { useEffect, useMemo, useState } from "react"
import StatusBarFrame, { type StatusBarLabelState } from "@/renderer/components/frames/StatusBar"
import TileProgressBar from "@/renderer/components/ui/TileProgressBar"
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
     * The tone the label takes.
     */
    const labelState = useMemo<StatusBarLabelState>(() => {
        if (state?.status === "connecting") return "pending"
        return state?.status === "connected" ? "default" : "muted"
    }, [state?.status])

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
        <StatusBarFrame icon={serverIcon} label={`MCP [${label}]`} labelState={labelState} className={className}>
            <TileProgressBar value={progress} isMuted={state.status !== "connected"} />
        </StatusBarFrame>
    )
}
