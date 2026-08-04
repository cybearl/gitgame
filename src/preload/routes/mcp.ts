import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { safeInvoke } from "@preload/lib/ipc"
import { ipcRenderer } from "electron"
import type { McpState } from "@/main/types/mcp"

const mcpApiRoutes: GitgameApi["mcp"] = {
    getState: () => safeInvoke(CONSTANTS.ipc.mcpGetState),
    onStateChange: callback => {
        const listener = (_: unknown, state: McpState) => callback(state)
        ipcRenderer.on(CONSTANTS.ipc.mcpStateChanged, listener)
        return () => ipcRenderer.off(CONSTANTS.ipc.mcpStateChanged, listener)
    },
    probe: () => safeInvoke(CONSTANTS.ipc.mcpProbe),
    getEditorActivity: () => safeInvoke(CONSTANTS.ipc.mcpGetEditorActivity),
    listTools: () => safeInvoke(CONSTANTS.ipc.mcpListTools),
    callTool: (toolset, name, args) => safeInvoke(CONSTANTS.ipc.mcpCallTool, toolset, name, args),
}

export default mcpApiRoutes
