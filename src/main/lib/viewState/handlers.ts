import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { getViewState, setViewState } from "@main/lib/viewState/service"
import type { AppViewState } from "@/main/types/store"

/**
 * Registers the IPC handlers for the persisted view state.
 */
export function registerViewStateHandlers() {
    safeHandle(CONSTANTS.ipc.viewStateGet, () => getViewState())
    safeHandle(CONSTANTS.ipc.viewStateSet, (_event, view: Partial<AppViewState>) => setViewState(view))
}
