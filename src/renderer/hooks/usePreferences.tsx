import { useEffect, useState } from "react"
import type { AppPreferences } from "@/main/types/store"

/**
 * The result of the `usePreferences` hook.
 */
export type UsePreferencesResult = {
    preferences: AppPreferences
}

/**
 * Tracks the committed application preferences.
 * @returns The live preferences.
 */
export default function usePreferences(): UsePreferencesResult {
    const [preferences, setPreferences] = useState<AppPreferences>(window.api.preferences.initial)

    // Follow the main process, a change committed in the preferences window has
    // to land here too
    useEffect(() => {
        const unsubscribe = window.api.preferences.onChange(setPreferences)
        return unsubscribe
    }, [])

    return { preferences }
}
