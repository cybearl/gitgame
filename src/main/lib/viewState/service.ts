import { stateStore } from "@main/lib/stores/state"
import type { AppViewState } from "@/main/types/store"

/**
 * Returns the persisted view state.
 * @returns The view state.
 */
export async function getViewState(): Promise<AppViewState> {
    return (await stateStore.get()).view
}

/**
 * Merges the given fields into the persisted view state.
 * @param view The view state fields to update.
 * @returns The updated view state.
 */
export async function setViewState(view: Partial<AppViewState>): Promise<AppViewState> {
    const updated = await stateStore.update(state => {
        state.view = {
            ...state.view,
            ...view,
        }

        return undefined
    })

    return updated.view
}
