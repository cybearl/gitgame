import MCP_CONFIG from "@main/config/mcp"
import { ObservableStore } from "@main/lib/stores/observable"
import type { McpState } from "@/main/types/mcp"

/**
 * Builds the state the MCP starts from, before the first probe has run.
 * @returns The initial MCP state.
 */
function createInitialState(): McpState {
    return {
        status: "disconnected",
        server: null,
        error: null,
        lastProbedAt: null,
        probeIntervalMs: MCP_CONFIG.probeIntervalMs,
    }
}

/**
 * The single app-wide MCP connection store, subscribed to by every window so
 * the status chip can follow the same transitions the service records.
 */
export const mcpStore = new ObservableStore<McpState>(createInitialState())
