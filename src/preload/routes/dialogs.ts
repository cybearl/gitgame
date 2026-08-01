import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const dialogsApiRoutes: GitgameApi["dialogs"] = {
    confirm: options => ipcRenderer.invoke(CONSTANTS.ipc.dialogsConfirm, options),
    message: (title, message) => ipcRenderer.send(CONSTANTS.ipc.dialogsMessage, title, message),
    error: (title, message) => ipcRenderer.send(CONSTANTS.ipc.dialogsError, title, message),
    errorWithDetails: (title, message, details) =>
        ipcRenderer.send(CONSTANTS.ipc.dialogsErrorWithDetails, title, message, details),
    getOptions: () => ipcRenderer.invoke(CONSTANTS.ipc.dialogsGetOptions),
    respond: result => ipcRenderer.send(CONSTANTS.ipc.dialogsRespond, result),
}

export default dialogsApiRoutes
