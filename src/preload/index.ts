import { contextBridge } from "electron"

/**
 * The API surface exposed to the renderer process via `window.api`.
 */
const api = {} as const

// Add IPC bindings here when the renderer needs to talk to the main process
contextBridge.exposeInMainWorld("api", api)

/**
 * The type representing the API surface available on `window.api` in the renderer.
 */
export type GitgameApi = typeof api
