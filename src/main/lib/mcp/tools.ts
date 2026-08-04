import { mcpClient } from "@main/lib/mcp/client"
import { mcpStore } from "@main/lib/mcp/store"
import CONSTANTS from "@/main/lib/constants"
import type { EditorActivity } from "@/main/types/mcp"

/**
 * Whether the MCP is currently connected, tool calls issued while
 * disconnected would fail on the wire and return misleading data.
 * @returns `true` when the initialize handshake has landed.
 */
function isConnected(): boolean {
    return mcpStore.get().status === "connected"
}

/**
 * Lists the assets currently open in asset editors, keyed by their virtual
 * `/Game/*` or plugin content path.
 * @returns The open asset paths, or an empty list when the MCP is offline.
 */
export async function getOpenAssets(): Promise<string[]> {
    if (!isConnected()) return []

    const result = (await mcpClient.callEditorTool(CONSTANTS.mcp.tools.getOpenAssets)) as {
        returnValue?: string[]
    } | null
    return result?.returnValue ?? []
}

/**
 * Reads the content path of the currently loaded level, treating scratch
 * `/Temp/*` levels as absent since they have no on-disk asset to lock.
 * @returns The level path, or `null` when the editor is on a scratch level.
 */
export async function getCurrentLevel(): Promise<string | null> {
    if (!isConnected()) return null

    const result = (await mcpClient.callEditorTool(CONSTANTS.mcp.tools.getCurrentLevel)) as {
        returnValue?: string
    } | null
    return result?.returnValue && !result.returnValue.startsWith(CONSTANTS.mcp.scratchLevelPrefix)
        ? result.returnValue
        : null
}

/**
 * Reads the dirty flag of a single asset, `true` when the editor holds
 * unsaved edits for it, `false` otherwise.
 * @param assetPath The virtual content path of the asset.
 * @returns The dirty flag, or `false` when the MCP is offline.
 */
export async function isAssetDirty(assetPath: string): Promise<boolean> {
    if (!isConnected()) return false

    const result = (await mcpClient.callEditorTool(CONSTANTS.mcp.tools.isDirty, { asset_path: assetPath })) as {
        returnValue?: boolean
    } | null

    return Boolean(result?.returnValue)
}

/**
 * Filters a list of asset paths down to those the editor currently holds
 * unsaved edits for, checks fan out concurrently since each `is_dirty` is
 * an independent localhost round-trip.
 * @param assetPaths The candidate paths to check.
 * @returns The subset that are dirty.
 */
async function filterDirtyAssets(assetPaths: string[]): Promise<string[]> {
    if (assetPaths.length === 0) return []

    const flags = await Promise.all(assetPaths.map(path => isAssetDirty(path)))
    return assetPaths.filter((_, index) => flags[index])
}

/**
 * Collects the editor's active-editing snapshot, dirty tabs from asset editors
 * plus the loaded level, OFPA external actors are out of scope for this pass
 * since UE's public asset API does not expose per-actor packages.
 * @returns The editor activity snapshot.
 */
export async function getEditorActivity(): Promise<EditorActivity> {
    if (!isConnected()) {
        return {
            openAssets: [],
            dirtyAssets: [],
            currentLevel: null,
        }
    }

    const [openAssets, currentLevel] = await Promise.all([getOpenAssets(), getCurrentLevel()])
    const dirtyAssets = await filterDirtyAssets(openAssets)

    return {
        openAssets,
        dirtyAssets,
        currentLevel,
    }
}
