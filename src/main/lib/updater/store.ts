import UPDATER_CONFIG from "@main/config/updater"
import { ObservableStore } from "@main/lib/stores/observable"
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
 * The updater's observable state store, extends the base with dismissal
 * tracking and a busy predicate specific to the update lifecycle.
 */
export class UpdaterStore extends ObservableStore<UpdaterState> {
    /**
     * The version whose dialog the user closed without acting, so the periodic
     * checks stop reopening it, cleared implicitly once the feed offers a
     * different version.
     */
    private _dismissedVersion: string | null = null

    constructor() {
        super(createInitialState())
    }

    /**
     * Whether a check or a download is already under way, in which case
     * starting another one would stack dialogs and race two writers onto the
     * same partial installer.
     * @returns `true` while the updater is mid-flight.
     */
    isBusy(): boolean {
        const current = this.get()
        return current.status === "checking" || current.status === "downloading" || current.status === "downloaded"
    }

    /**
     * Records the pending version as dismissed, so the periodic checks stop
     * reopening the dialog for it, only meaningful while an update is merely
     * `available` since a downloaded one is surfaced by the status bar instead.
     */
    dismissAvailableVersion() {
        const current = this.get()
        if (current.status === "available" && current.version) this._dismissedVersion = current.version
    }

    /**
     * Whether the pending version is one the user already closed the dialog on.
     * @returns `true` when the dialog should not be reopened on its own.
     */
    isAvailableVersionDismissed(): boolean {
        const current = this.get()
        return current.version !== null && current.version === this._dismissedVersion
    }

    /**
     * Forgets any dismissal, so the next available version prompts again.
     */
    clearDismissedVersion() {
        this._dismissedVersion = null
    }
}

/**
 * The single app-wide updater store, subscribed to by every open window so the
 * dialog and status bar follow the same transitions.
 */
export const updaterStore = new UpdaterStore()
