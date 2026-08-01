import type { ProgressInfo, UpdateInfo } from "electron-updater"
import type { UpdaterDownloadProgress } from "@/main/types/updater"

/**
 * Flattens electron-updater's release notes, which arrive either as a single
 * string or as one entry per skipped version.
 * @param notes The release notes carried by the update info.
 * @returns The notes as a single string, or `null` when the feed carried none.
 */
export function normalizeReleaseNotes(notes: UpdateInfo["releaseNotes"]): string | null {
    if (!notes) return null
    if (typeof notes === "string") return notes

    const joined = notes
        .map(entry => (entry.version ? `${entry.version}\n${entry.note ?? ""}` : (entry.note ?? "")))
        .filter(entry => entry.trim().length > 0)
        .join("\n\n")

    return joined.length > 0 ? joined : null
}

/**
 * Narrows electron-updater's progress payload to the fields the dialog renders.
 * @param info The progress info emitted while downloading.
 * @returns The progress snapshot.
 */
export function parseDownloadProgress(info: ProgressInfo): UpdaterDownloadProgress {
    return {
        percent: info.percent,
        transferred: info.transferred,
        total: info.total,
        bytesPerSecond: info.bytesPerSecond,
    }
}
