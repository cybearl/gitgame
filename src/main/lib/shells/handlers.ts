import CONSTANTS from "@main/lib/constants"
import { safeHandle } from "@main/lib/ipc"
import { openEditor, openTerminal, showFolder } from "@main/lib/shells/service"
import { ipcMain, shell } from "electron"

/**
 * The URL protocols permitted to be opened externally.
 *
 * Note: restricting to http(s) avoids launching arbitrary
 * protocol handlers from a renderer-provided URL.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

/**
 * Registers the IPC handlers that open an external URL in the user's default browser
 * (ignoring any URL that is malformed or uses a disallowed protocol) and that hand a
 * folder to the OS file manager, to a terminal or to a code editor.
 */
export function registerShellsHandlers() {
    safeHandle(CONSTANTS.ipc.shellsShowFolder, (_event, dir: string) => showFolder(dir))
    safeHandle(CONSTANTS.ipc.shellsOpenTerminal, (_event, dir: string) => openTerminal(dir))
    safeHandle(CONSTANTS.ipc.shellsOpenEditor, (_event, dir: string) => openEditor(dir))

    ipcMain.on(CONSTANTS.ipc.shellsOpenExternal, (_event, url: string) => {
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
