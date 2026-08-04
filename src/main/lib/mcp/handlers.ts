import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { mcpClient } from "@main/lib/mcp/client"
import { mcpService } from "@main/lib/mcp/service"
import { mcpStore } from "@main/lib/mcp/store"
import { getEditorActivity } from "@main/lib/mcp/tools"

/**
 * Registers the IPC handlers that expose the MCP connection to the renderer,
 * covering connection state, forced probe, editor activity snapshot, and the
 * raw `tools/list` output for debugging.
 */
export function registerMcpHandlers() {
    safeHandle(CONSTANTS.ipc.mcpGetState, () => mcpStore.get())
    safeHandle(CONSTANTS.ipc.mcpProbe, () => mcpService.probe())
    safeHandle(CONSTANTS.ipc.mcpGetEditorActivity, () => getEditorActivity())
    safeHandle(CONSTANTS.ipc.mcpListTools, () => mcpClient.listTools())
    safeHandle(CONSTANTS.ipc.mcpCallTool, (_event, toolset: string, name: string, args?: Record<string, unknown>) =>
        mcpClient.callTool(toolset, name, args),
    )
}
