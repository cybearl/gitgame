import CONSTANTS from "@main/lib/constants"
import { ipcMain, shell } from "electron"

/**
 * The URL protocols permitted to be opened externally.
 *
 * Note: restricting to http(s) avoids launching arbitrary
 * protocol handlers from a renderer-provided URL.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

/**
 * Registers the IPC handler that opens an external URL in the user's default
 * browser, ignoring any URL that is malformed or uses a disallowed protocol.
 */
export function registerShellHandlers() {
    ipcMain.on(CONSTANTS.ipc.shellOpenExternal, (_event, url: string) => {
        let parsed: URL

        try {
            parsed = new URL(url)
        } catch {
            return
        }

        if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return

        shell.openExternal(url)
    })
}
