import MCP_CONFIG from "@main/config/mcp"
import { McpError, mcpClient } from "@main/lib/mcp/client"
import { mcpStore } from "@main/lib/mcp/store"
import { convertErrorToMessage } from "@main/lib/utils/errors"
import type { McpState } from "@/main/types/mcp"

/**
 * The periodic probe lifecycle owner, keeps the store in sync with whether the
 * editor is running and guards against overlapping in-flight probes, one
 * instance per app so the app-wide `mcpService` singleton is enough.
 */
export class McpService {
    /**
     * The current probe loop's timer, held so restarting the loop cannot leave
     * a second timer behind.
     */
    private _probeTimer: NodeJS.Timeout | null = null

    /**
     * Whether a probe is currently in flight, guards the periodic timer from
     * stacking a second call on top of one that has not landed yet.
     */
    private _probeInFlight = false

    /**
     * Waits until the given start time has been in the past for at least
     * `minMs`, so a "connecting" state that was emitted is guaranteed to stay
     * visible long enough for the user to notice the transition.
     * @param startedAt The epoch time when the transition began.
     * @param minMs The minimum elapsed time to enforce.
     */
    private async _waitForMinDisplay(startedAt: number, minMs: number) {
        const remaining = minMs - (Date.now() - startedAt)
        if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining))
    }

    /**
     * Runs a single probe against the MCP server, updating the store with the
     * result, the `connecting` phase is held for at least
     * `MCP_CONFIG.minConnectingDisplayMs` so a fast probe does not flicker past.
     * @returns The state that resulted from the probe.
     */
    async probe(): Promise<McpState> {
        if (this._probeInFlight) return mcpStore.get()
        this._probeInFlight = true

        const wasConnected = mcpStore.get().status === "connected"
        const startedAt = Date.now()

        if (!wasConnected) mcpStore.set({ status: "connecting", error: null })

        try {
            const server = await mcpClient.initialize()
            if (!wasConnected) await this._waitForMinDisplay(startedAt, MCP_CONFIG.minConnectingDisplayMs)

            mcpStore.set({
                status: "connected",
                server,
                error: null,
                lastProbedAt: new Date().toISOString(),
            })
        } catch (error) {
            mcpClient.resetSession()
            if (!wasConnected) await this._waitForMinDisplay(startedAt, MCP_CONFIG.minConnectingDisplayMs)

            mcpStore.set({
                status: "disconnected",
                server: null,
                error: error instanceof McpError ? error.message : convertErrorToMessage(error),
                lastProbedAt: new Date().toISOString(),
            })
        } finally {
            this._probeInFlight = false
        }

        return mcpStore.get()
    }

    /**
     * Starts the periodic probe loop that keeps the connection state in sync
     * with whether the editor is running, ticks at `MCP_CONFIG.probeIntervalMs`,
     * a no-op when the loop is already running.
     */
    start() {
        if (this._probeTimer) return

        this.probe()
        this._probeTimer = setInterval(() => this.probe(), MCP_CONFIG.probeIntervalMs)
    }

    /**
     * Stops the periodic probe loop, a hook for tests and for a future
     * "pause auto-probe" preference.
     */
    stop() {
        if (!this._probeTimer) return

        clearInterval(this._probeTimer)
        this._probeTimer = null
    }
}

/**
 * The single app-wide MCP service, driven by the app entry point.
 */
export const mcpService = new McpService()
