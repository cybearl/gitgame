import CONSTANTS from "@main/lib/constants"
import { mcpService } from "@main/lib/mcp/service"
import { mcpStore } from "@main/lib/mcp/store"
import { preferencesStore } from "@main/lib/stores/preferences"
import { BrowserWindow } from "electron"
import type { McpState } from "@/main/types/mcp"

/**
 * Pushes the MCP state to every open window, so the status bar and any
 * later auto-lock UI can follow the same transitions.
 * @param next The new MCP state.
 */
function broadcastMcpState(next: McpState) {
    BrowserWindow.getAllWindows().forEach(window => {
        if (window.isDestroyed()) return
        window.webContents.send(CONSTANTS.ipc.mcpStateChanged, next)
    })
}

/**
 * Starts the MCP client, mirroring its connection state onto every window and
 * launching the periodic probe loop that keeps that state fresh.
 */
export function startMcp() {
    mcpStore.subscribe(broadcastMcpState)
    preferencesStore.subscribe(next => mcpService.reconfigure(next))
    mcpService.start()
}
