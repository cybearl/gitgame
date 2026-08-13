import DEFAULT_APP_CONFIG from "@main/config/app"
import STORE_CONFIG from "@main/config/store"
import { JsonStore } from "@main/lib/stores/json"
import type { AppConfig } from "@/main/types/store"

/**
 * Merges a possibly partial or outdated on-disk config with the defaults so the
 * rest of the app can rely on every field being present.
 * @param partial The raw parsed config, which may be missing fields.
 * @returns A complete `AppConfig`.
 */
function normalizeConfig(partial: Partial<AppConfig>): AppConfig {
    const preferences = partial.preferences ?? DEFAULT_APP_CONFIG.preferences

    return {
        version: STORE_CONFIG.configVersion,
        preferences: {
            theme: preferences.theme ?? DEFAULT_APP_CONFIG.preferences.theme,
            startupBehavior: preferences.startupBehavior ?? DEFAULT_APP_CONFIG.preferences.startupBehavior,
            autoLockTickIntervalMs:
                preferences.autoLockTickIntervalMs ?? DEFAULT_APP_CONFIG.preferences.autoLockTickIntervalMs,
            mcpEndpoint: preferences.mcpEndpoint ?? DEFAULT_APP_CONFIG.preferences.mcpEndpoint,
            mcpProbeIntervalMs: preferences.mcpProbeIntervalMs ?? DEFAULT_APP_CONFIG.preferences.mcpProbeIntervalMs,
            isCompileDbAutoRegenEnabled:
                preferences.isCompileDbAutoRegenEnabled ?? DEFAULT_APP_CONFIG.preferences.isCompileDbAutoRegenEnabled,
            compileDbDebounceMs: preferences.compileDbDebounceMs ?? DEFAULT_APP_CONFIG.preferences.compileDbDebounceMs,
            unrealEngineRoot: preferences.unrealEngineRoot ?? DEFAULT_APP_CONFIG.preferences.unrealEngineRoot,
            isAutomaticUpdateCheckEnabled:
                preferences.isAutomaticUpdateCheckEnabled ??
                DEFAULT_APP_CONFIG.preferences.isAutomaticUpdateCheckEnabled,
            updaterCheckIntervalMs:
                preferences.updaterCheckIntervalMs ?? DEFAULT_APP_CONFIG.preferences.updaterCheckIntervalMs,
        },
    }
}

/**
 * The single app-wide config store, holding the user-authored preferences.
 */
export const configStore = new JsonStore<AppConfig>({
    fileName: STORE_CONFIG.configFileName,
    defaults: DEFAULT_APP_CONFIG,
    normalize: normalizeConfig,
})
