import type { UpdaterDownloadProgress, UpdaterState } from "@/main/types/updater"
import CONSTANTS from "@/renderer/lib/constants"

/**
 * Formats a byte count into a human-readable size.
 * @param bytes The number of bytes.
 * @returns The formatted size, e.g. `42.3 MB`.
 */
function formatBytes(bytes: number): string {
    let value = Math.max(0, bytes)
    let unitIndex = 0

    while (value >= 1024 && unitIndex < CONSTANTS.BYTE_UNITS.length - 1) {
        value /= 1024
        unitIndex += 1
    }

    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${CONSTANTS.BYTE_UNITS[unitIndex]}`
}

/**
 * Converts the release body served by GitHub into plain text notes, since the feed
 * hands out HTML that would otherwise render as literal tags.
 * @param body The raw release body, if any.
 * @returns The notes as plain text, or `null` when there are none.
 */
export function convertReleaseBodyToReleaseNotes(body: string | null): string | null {
    if (!body) return null

    const notes = body
        .replace(/<\s*br\s*\/?\s*>/gi, "\n")
        .replace(/<\s*\/\s*(p|li|h[1-6]|div)\s*>/gi, "\n")
        .replace(/<\s*li\s*>/gi, "- ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

    return notes.length > 0 ? notes : null
}

/**
 * Builds the headline shown at the top of the update dialog.
 * @param state The current updater state.
 * @returns The headline for the state.
 */
export function buildUpdaterHeadline(state: UpdaterState): string {
    switch (state.status) {
        case "checking":
            return "Checking for updates..."
        case "not-available":
            return "GitGame is up to date"
        case "available":
            return `GitGame ${state.version} is available`
        case "downloading":
            return `Downloading GitGame ${state.version}...`
        case "downloaded":
            return `GitGame ${state.version} is ready to install`
        case "error":
            return "Could not check for updates"
        default:
            return "Software update"
    }
}

/**
 * Builds the sentence shown under the headline, explaining what happens next.
 * @param state The current updater state.
 * @returns The supporting line, or `null` when the headline says it all.
 */
export function buildUpdaterDetails(state: UpdaterState): string | null {
    switch (state.status) {
        case "not-available":
            return `You are running version ${state.currentVersion}, the latest one published.`
        case "available":
            return state.canAutoInstall
                ? `You are running version ${state.currentVersion}, the update downloads in the background and installs when you restart.`
                : `You are running version ${state.currentVersion}. Automatic updates are not available on this platform, so grab the installer from the releases page.`
        case "downloaded":
            return "Restart now to apply it, or keep working and it installs the next time you quit GitGame."
        case "error":
            return state.error
        default:
            return null
    }
}

/**
 * Builds the label of the status bar's update indicator, which stands in for the
 * dialog once it has been dismissed.
 * @param state The current updater state.
 * @returns The label, or `null` when there is nothing pending to advertise.
 */
export function buildUpdaterStatusLabel(state: UpdaterState): string | null {
    if (state.status === "downloaded") return `Restart to update to ${state.version}`
    if (state.status === "available") return `Update to ${state.version} available`

    return null
}

/**
 * Formats the transferred and total bytes of a running download, alongside its
 * current speed.
 * @param progress The download progress snapshot.
 * @returns The label shown under the progress bar.
 */
export function buildDownloadLabel(progress: UpdaterDownloadProgress): string {
    if (progress.total <= 0) return "Starting the download..."

    const transferred = `${formatBytes(progress.transferred)} of ${formatBytes(progress.total)}`
    if (progress.bytesPerSecond <= 0) return transferred

    return `${transferred} (${formatBytes(progress.bytesPerSecond)}/s)`
}
