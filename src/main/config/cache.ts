import type { AppCache } from "@/main/types/store"

/**
 * The default cache used when no cache file exists yet, or when the existing one
 * is missing fields.
 */
const DEFAULT_APP_CACHE: AppCache = {
    lfsLocks: {},
}

export default DEFAULT_APP_CACHE
