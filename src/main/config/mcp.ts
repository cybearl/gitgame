/**
 * The configuration for the Unreal Engine MCP client.
 */
const MCP_CONFIG = {
    endpoint: "http://127.0.0.1:8000/mcp",
    protocolVersion: "2025-06-18",
    clientName: "gitgame",
    probeIntervalMs: 5 * 1000,
    requestTimeoutMs: 5 * 1000,
    minConnectingDisplayMs: 500,
}

export default MCP_CONFIG
