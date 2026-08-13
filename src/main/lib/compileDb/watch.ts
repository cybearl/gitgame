import { type FSWatcher, watch } from "node:fs"
import { resolveWatchRoots } from "@main/lib/compileDb/paths"
import { pathExists } from "@main/lib/utils/fs"

/**
 * Attaches a recursive watcher to each source tree that exists, scoped to those
 * rather than the repository root so the trees the build tool churns through
 * never reach us, the callback carries no path because an event only means
 * "re-scan".
 * @param root The absolute repository root path.
 * @param onChange Called on every event inside a watched tree.
 * @returns The attached watchers, to be closed by the caller.
 */
export async function watchSourceTrees(root: string, onChange: () => void): Promise<FSWatcher[]> {
    const watchers: FSWatcher[] = []

    for (const watchRoot of resolveWatchRoots(root)) {
        if (!(await pathExists(watchRoot))) continue

        // A tree can still go away between that check and this call, and a watcher
        // can die later on for the same reason, neither of which is worth taking
        // the main process down over, the next project bind sets things up again
        try {
            const watcher = watch(watchRoot, { recursive: true, persistent: false }, () => onChange())

            watcher.on("error", () => watcher.close())
            watchers.push(watcher)
        } catch (error) {
            console.error(`[compileDb] could not watch "${watchRoot}":`, error)
        }
    }

    return watchers
}
