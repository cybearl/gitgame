import type { McpState } from "@/main/types/mcp"

/**
 * Computes the fill percentage (0-100) of the countdown bar, based on the time
 * elapsed since the last probe landed as a fraction of the probe interval.
 * @param state The current MCP state.
 * @param now The current epoch time in ms, sampled by the chip's tick.
 * @returns The bar fill percentage, `0` before the first probe lands.
 */
export function computeProbeProgress(state: McpState, now: number): number {
    if (!state.lastProbedAt) return 0

    const elapsed = now - new Date(state.lastProbedAt).getTime()
    const fraction = elapsed / state.probeIntervalMs

    return Math.min(100, Math.max(0, fraction * 100))
}

/**
 * Builds the short label shown in the status bar chip, one word per state so
 * the chip stays narrow at every width.
 * @param state The current MCP state.
 * @returns The chip label.
 */
export function buildMcpStatusLabel(state: McpState): string {
    switch (state.status) {
        case "connected":
            return "Connected"
        case "connecting":
            return "Connecting..."
        case "disconnected":
            return "Offline"
    }
}
