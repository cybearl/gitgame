import UPDATER_CONFIG from "@main/config/updater"
import { CLEARED_RELEASE_FIELDS } from "@main/lib/updater/store"
import type { UpdaterDownloadProgress, UpdaterSimulation, UpdaterState } from "@/main/types/updater"

/**
 * The release notes shown by the simulated flows, standing in for a GitHub release
 * body.
 */
const SIMULATED_RELEASE_NOTES = [
    "Added a proper update dialog with download progress and a restart prompt.",
    "Fixed renamed files not appearing inside the tree view.",
    "Streamed per-file lock progress to the status bar.",
].join("\n")

/**
 * Builds the progress a simulated download reports at a given point, so the bar and
 * its byte counters move like a real one.
 * @param percent How far along the fake download is.
 * @returns The progress snapshot.
 */
export function buildSimulatedProgress(percent: number): UpdaterDownloadProgress {
    return {
        percent,
        transferred: Math.round((UPDATER_CONFIG.simulatedDownload.totalBytes * percent) / 100),
        total: UPDATER_CONFIG.simulatedDownload.totalBytes,
        bytesPerSecond: UPDATER_CONFIG.simulatedDownload.totalBytes / 20,
    }
}

/**
 * Builds the state a simulated scenario lands on, so the dialog can be driven
 * through each of its phases from the `Dev Tools` menu.
 * @param scenario The flow to simulate.
 * @param releaseDate The timestamp to stamp an available release with.
 * @returns The transition to apply.
 */
export function buildSimulatedState(scenario: UpdaterSimulation, releaseDate: string): Partial<UpdaterState> {
    if (scenario === "up-to-date") {
        return {
            status: "not-available",
            ...CLEARED_RELEASE_FIELDS,
            progress: null,
            error: null,
        }
    }

    if (scenario === "error") {
        return {
            status: "error",
            ...CLEARED_RELEASE_FIELDS,
            progress: null,
            error: "net::ERR_INTERNET_DISCONNECTED (simulated)",
        }
    }

    return {
        status: "available",
        canAutoInstall: scenario === "download",
        version: UPDATER_CONFIG.simulatedDownload.version,
        releaseNotes: SIMULATED_RELEASE_NOTES,
        releaseDate,
        progress: null,
        error: null,
    }
}
