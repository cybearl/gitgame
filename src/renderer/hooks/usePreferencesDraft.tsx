import usePreferences from "@renderer/hooks/usePreferences"
import { useCallback, useState } from "react"
import type { AppPreferences } from "@/main/types/store"
import { arePreferencesEqual } from "@/renderer/lib/utils/preferences"

/**
 * The result of the `usePreferencesDraft` hook.
 */
export type UsePreferencesDraftResult = {
    draft: AppPreferences
    isDirty: boolean
    setField: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void
    apply: () => Promise<void>
}

/**
 * Holds the edits made in the preferences window apart from the committed
 * preferences, so nothing reaches the rest of the app until the user says so
 * and closing the window is all a cancel has to do.
 * @returns The draft, whether it has diverged, and the way to edit and commit it.
 */
export default function usePreferencesDraft(): UsePreferencesDraftResult {
    const { preferences } = usePreferences()
    const [draft, setDraft] = useState<AppPreferences>(preferences)

    const isDirty = !arePreferencesEqual(draft, preferences)

    /**
     * Records an edit to one field of the draft.
     * @param key The field to change.
     * @param value Its new value.
     */
    const setField = useCallback(<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
        setDraft(current => ({ ...current, [key]: value }))
    }, [])

    /**
     * Commits the draft, the broadcast that follows lands back here and settles
     * the dirty flag on its own.
     */
    const apply = useCallback(async () => {
        await window.api.preferences.set(draft)
    }, [draft])

    return { draft, isDirty, setField, apply }
}
