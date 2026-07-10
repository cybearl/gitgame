import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { ipcRenderer } from "electron"

const dialogsApiRoutes: GitgameApi["dialogs"] = {
    confirm: options => ipcRenderer.invoke(CONSTANTS.ipc.dialogsConfirm, options),
    error: (title, content) => ipcRenderer.send(CONSTANTS.ipc.dialogsError, title, content),
    getOptions: () => ipcRenderer.invoke(CONSTANTS.ipc.dialogsGetOptions),
    respond: result => ipcRenderer.send(CONSTANTS.ipc.dialogsRespond, result),
}

export default dialogsApiRoutes
