import UPDATER_CONFIG from "@main/config/updater"
import type { UpdaterState } from "@/main/types/updater"

/**
 * The fields describing the pending release, cleared whenever the updater leaves
 * that release behind, so a dismissed version cannot leave its notes attached to a
 * later result.
 */
export const CLEARED_RELEASE_FIELDS = {
    version: null,
    releaseNotes: null,
    releaseDate: null,
} satisfies Partial<UpdaterState>

/**
 * Builds the state the updater starts from, before anything has been checked. The
 * running version is filled in by `initUpdater`, since this runs while the module
 * is still being evaluated and `app` is not available yet.
 * @returns The initial updater state.
 */
function createInitialState(): UpdaterState {
    return {
        status: "idle",
        canAutoInstall: UPDATER_CONFIG.autoInstallPlatforms.includes(process.platform),
        currentVersion: "",
        ...CLEARED_RELEASE_FIELDS,
        releaseUrl: UPDATER_CONFIG.releasesUrl,
        progress: null,
        error: null,
    }
}

/**
 * The single source of truth for the updater, owned by the main process so the
 * dialog can be closed and reopened without losing where the update got to.
 */
let state: UpdaterState = createInitialState()

/**
 * The subscribers notified on every state transition.
 */
const listeners = new Set<(next: UpdaterState) => void>()

/**
 * The version whose dialog the user closed without acting, so the periodic checks
 * stop reopening it. Cleared implicitly once the feed offers a different version.
 */
let dismissedVersion: string | null = null

/**
 * Reads the current updater state.
 * @returns The current state.
 */
export function getUpdaterState(): UpdaterState {
    return state
}

/**
 * Notifies every subscriber of the current state, without changing it.
 */
export function emitUpdaterState() {
    listeners.forEach(listener => {
        listener(state)
    })
}

/**
 * Applies a partial transition to the updater state and notifies subscribers.
 * @param patch The fields to change.
 */
export function setUpdaterState(patch: Partial<UpdaterState>) {
    state = { ...state, ...patch }
    emitUpdaterState()
}

/**
 * Subscribes to updater state transitions.
 * @param listener The callback invoked with each new state.
 * @returns A function that removes the subscription.
 */
export function subscribeToUpdaterState(listener: (next: UpdaterState) => void): () => void {
    listeners.add(listener)

    return () => {
        listeners.delete(listener)
    }
}

/**
 * Whether a check or a download is already under way, in which case starting
 * another one would stack dialogs and race two writers onto the same partial
 * installer.
 * @returns `true` while the updater is mid-flight.
 */
export function isUpdaterBusy(): boolean {
    return state.status === "checking" || state.status === "downloading" || state.status === "downloaded"
}

/**
 * Records the pending version as dismissed, so the periodic checks stop reopening
 * the dialog for it. Only meaningful while an update is merely `available`, since a
 * download that already ran is surfaced by the status bar instead.
 */
export function dismissAvailableVersion() {
    if (state.status === "available" && state.version) dismissedVersion = state.version
}

/**
 * Whether the pending version is one the user already closed the dialog on.
 * @returns `true` when the dialog should not be reopened on its own.
 */
export function isAvailableVersionDismissed(): boolean {
    return state.version !== null && state.version === dismissedVersion
}

/**
 * Forgets any dismissal, so the next available version prompts again.
 */
export function clearDismissedVersion() {
    dismissedVersion = null
}
