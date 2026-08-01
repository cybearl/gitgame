/**
 * The lifecycle phase of the auto-updater:
 * - `idle`: nothing has been checked yet, or the last result was dismissed.
 * - `checking`: a check against the release feed is in flight.
 * - `not-available`: the running version is the latest one published.
 * - `available`: a newer version was found and is waiting on the user.
 * - `downloading`: the installer is being fetched.
 * - `downloaded`: the installer is staged and waiting for a restart.
 * - `error`: the last check or download failed.
 */
export type UpdaterStatus = "idle" | "checking" | "not-available" | "available" | "downloading" | "downloaded" | "error"

/**
 * A snapshot of the installer download, mirroring electron-updater's `ProgressInfo`.
 */
export type UpdaterDownloadProgress = {
    percent: number
    transferred: number
    total: number
    bytesPerSecond: number
}

/**
 * The full updater state, broadcast to every open window on each transition.
 */
export type UpdaterState = {
    status: UpdaterStatus
    canAutoInstall: boolean // Only true on Windows
    currentVersion: string
    version: string | null
    releaseNotes: string | null
    releaseDate: string | null
    releaseUrl: string
    progress: UpdaterDownloadProgress | null
    error: string | null
}

/**
 * The fake updater flows that the `Dev Tools` menu can drive, so the dialog can
 * be previewed without a packaged build behind a real release feed.
 */
export type UpdaterSimulation = "download" | "link-only" | "up-to-date" | "error"
