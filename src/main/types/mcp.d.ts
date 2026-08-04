/**
 * The connection state to the UE MCP server:
 * - `disconnected`: When the editor is closed or unreachable.
 * - `connecting`: While a probe is in flight.
 * - `connected`: Once the JSON-RPC `initialize` handshake has landed.
 */
export type McpConnectionStatus = "disconnected" | "connecting" | "connected"

/**
 * The identifying information the MCP server returned during `initialize`,
 * kept around so the status bar can name the server it is talking to.
 */
export type McpServerInfo = {
    name: string
    version: string
    protocolVersion: string
}

/**
 * The full MCP connection state, broadcast to every open window on each
 * transition, mirrors the shape used by the updater state so the renderer
 * can follow the same subscribe/emit pattern.
 */
export type McpState = {
    status: McpConnectionStatus
    server: McpServerInfo | null
    error: string | null
    lastProbedAt: string | null
    probeIntervalMs: number
}

/**
 * A snapshot of the editor's currently-edited assets.
 */
export type EditorActivity = {
    openAssets: string[]
    dirtyAssets: string[]
    currentLevel: string | null
}
