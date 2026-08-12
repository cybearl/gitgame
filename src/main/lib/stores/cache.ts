import DEFAULT_APP_CACHE from "@main/config/cache"
import STORE_CONFIG from "@main/config/store"
import { JsonStore } from "@main/lib/stores/json"
import type { AppCache } from "@/main/types/store"

/**
 * Merges a possibly partial on-disk cache with the defaults so the rest of the
 * app can rely on every field being present.
 * @param partial The raw parsed cache, which may be missing fields.
 * @returns A complete `AppCache`.
 */
function normalizeCache(partial: Partial<AppCache>): AppCache {
    return {
        lfsLocks:
            partial.lfsLocks && typeof partial.lfsLocks === "object" && !Array.isArray(partial.lfsLocks)
                ? partial.lfsLocks
                : {},
    }
}

/**
 * The single app-wide cache store, holding the re-generable LFS lock snapshots.
 */
export const cacheStore = new JsonStore<AppCache>({
    fileName: STORE_CONFIG.cacheFileName,
    defaults: DEFAULT_APP_CACHE,
    normalize: normalizeCache,
})
