import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

/**
 * The API surface for the Win95-styled dialog windows, used both by callers
 * (`confirm`, `error`) and by the dialog window itself (`getOptions`, `respond`).
 */
const dialogApiRoutes: GitgameApi["dialog"] = {
    confirm: options => ipcRenderer.invoke(CONSTANTS.ipc.dialogConfirm, options),
    error: (title, content) => ipcRenderer.send(CONSTANTS.ipc.dialogError, title, content),
    getOptions: () => ipcRenderer.invoke(CONSTANTS.ipc.dialogGetOptions),
    respond: result => ipcRenderer.send(CONSTANTS.ipc.dialogRespond, result),
}

export default dialogApiRoutes
