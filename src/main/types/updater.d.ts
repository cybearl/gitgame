/**
 * The lifecycle phase of the auto-updater, moves from `idle` through `checking`
 * to either `not-available`, `available` (then `downloading` and `downloaded`),
 * or `error`, drives what the update dialog shows at each transition.
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
