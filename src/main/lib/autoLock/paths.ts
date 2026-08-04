import CONSTANTS from "@main/lib/constants"

/**
 * Converts a UE virtual content path into a repo-relative disk path with the
 * given file extension, `null` for paths outside `/Game/` (plugin and engine
 * roots are not covered by this first pass).
 * @param virtualPath The UE virtual path like `/Game/Blueprints/BP_Hero`.
 * @param extension The disk-file extension to append.
 * @returns The repo-relative path with forward-slash separators, or `null`.
 */
function virtualToDisk(virtualPath: string, extension: string): string | null {
    if (!virtualPath.startsWith(CONSTANTS.mcp.gamePrefix)) return null

    const relative = virtualPath.slice(CONSTANTS.mcp.gamePrefix.length)
    return `${CONSTANTS.mcp.contentDir}/${relative}${extension}`
}

/**
 * Resolves a UE asset's virtual path to its repo-relative `.uasset` on disk.
 * @param virtualPath The virtual path returned by `GetOpenAssets` or `is_dirty`.
 * @returns The repo-relative disk path, or `null` when outside `/Game/`.
 */
export function resolveAssetDiskPath(virtualPath: string): string | null {
    return virtualToDisk(virtualPath, CONSTANTS.mcp.assetExtension)
}

/**
 * Resolves a UE level's virtual path to its repo-relative `.umap` on disk.
 * @param virtualPath The virtual path returned by `get_current_level`.
 * @returns The repo-relative disk path, or `null` when outside `/Game/`.
 */
export function resolveLevelDiskPath(virtualPath: string): string | null {
    return virtualToDisk(virtualPath, CONSTANTS.mcp.levelExtension)
}
