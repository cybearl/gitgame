import { configStore } from "@main/lib/stores/config"
import { preferencesStore } from "@main/lib/stores/preferences"
import type { AppPreferences } from "@/main/types/store"

/**
 * Hydrates the in-memory preferences from disk, awaited once at startup so the
 * synchronous preload bridge and every later read see the persisted values.
 * @returns The loaded preferences.
 */
export async function loadPreferences(): Promise<AppPreferences> {
    const { preferences } = await configStore.get()
    preferencesStore.set(preferences)

    return preferences
}

/**
 * Merges the given fields into the preferences, persists them, and notifies
 * every subscriber.
 * @param patch The preference fields to update.
 * @returns The updated preferences.
 */
export async function setPreferences(patch: Partial<AppPreferences>): Promise<AppPreferences> {
    const updated = await configStore.update(config => {
        config.preferences = {
            ...config.preferences,
            ...patch,
        }

        return undefined
    })

    preferencesStore.set(updated.preferences)

    return updated.preferences
}
