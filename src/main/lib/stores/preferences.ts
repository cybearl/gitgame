import DEFAULT_APP_CONFIG from "@main/config/app"
import { ObservableStore } from "@main/lib/stores/observable"
import type { AppPreferences } from "@/main/types/store"

/**
 * The single app-wide preferences store, subscribed to by every window and by
 * the services a preference tunes, so one change lands everywhere at once.
 */
export const preferencesStore = new ObservableStore<AppPreferences>(DEFAULT_APP_CONFIG.preferences)
