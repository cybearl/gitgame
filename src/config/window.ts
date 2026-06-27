import path from "node:path"
import type { BrowserWindowConstructorOptions } from "electron"

/**
 * The default options used when constructing the application's main BrowserWindow.
 */
const WINDOW_CONFIG: BrowserWindowConstructorOptions = {
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
        preload: path.join(__dirname, "..", "preload", "index.js"),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
    },
}

export default WINDOW_CONFIG
