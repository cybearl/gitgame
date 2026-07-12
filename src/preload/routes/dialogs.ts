import CONSTANTS from "@main/lib/constants"
import type { GitgameApi } from "@preload/index"
import { getErrorAudio } from "@preload/lib/audio"
import { ipcRenderer } from "electron"

const dialogsApiRoutes: GitgameApi["dialogs"] = {
    confirm: options => ipcRenderer.invoke(CONSTANTS.ipc.dialogsConfirm, options),
    error: (title, message, detail) => {
        const audio = getErrorAudio()
        audio.currentTime = 0
        audio.play().catch(() => null)

        ipcRenderer.send(CONSTANTS.ipc.dialogsError, title, message, detail)
    },
    getOptions: () => ipcRenderer.invoke(CONSTANTS.ipc.dialogsGetOptions),
    respond: result => ipcRenderer.send(CONSTANTS.ipc.dialogsRespond, result),
}

export default dialogsApiRoutes
