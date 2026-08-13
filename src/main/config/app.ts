import AUTO_LOCK_CONFIG from "@main/config/autoLock"
import COMPILE_DB_CONFIG from "@main/config/compileDb"
import MCP_CONFIG from "@main/config/mcp"
import STORE_CONFIG from "@main/config/store"
import UPDATER_CONFIG from "@main/config/updater"
import type { AppConfig } from "@/main/types/store"

/**
 * The default configuration used when no config file exists yet,
 * or when the existing one is missing fields.
 */
const DEFAULT_APP_CONFIG: AppConfig = {
    version: STORE_CONFIG.configVersion,
    preferences: {
        theme: "original",
        startupBehavior: "reopen-last",
        autoLockTickIntervalMs: AUTO_LOCK_CONFIG.tickIntervalMs,
        mcpEndpoint: MCP_CONFIG.endpoint,
        mcpProbeIntervalMs: MCP_CONFIG.probeIntervalMs,
        isCompileDbAutoRegenEnabled: false, // Off by default since it's pretty specific
        compileDbDebounceMs: COMPILE_DB_CONFIG.debounceMs,
        unrealEngineRoot: "",
        isAutomaticUpdateCheckEnabled: true,
        updaterCheckIntervalMs: UPDATER_CONFIG.checkIntervalMs,
    },
}

export default DEFAULT_APP_CONFIG
