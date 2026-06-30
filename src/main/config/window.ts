import path from "node:path"
import CONSTANTS from "@main/lib/constants"
import type { BrowserWindowConstructorOptions } from "electron"

/**
 * The default options used when constructing the application's main BrowserWindow.
 */
const WINDOW_CONFIG: BrowserWindowConstructorOptions = {
    width: 1280,
    height: 800,
    show: false,
    frame: false,
    thickFrame: true,
    useContentSize: true,
    autoHideMenuBar: true,
    roundedCorners: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    titleBarOverlay: process.platform === "darwin" ? { height: CONSTANTS.titleBarHeight } : undefined,
    trafficLightPosition: {
        x: 20,
        y: CONSTANTS.titleBarHeight / 2 - CONSTANTS.macOSTrafficLightsHeight / 2,
    },
    acceptFirstMouse: true,
    webPreferences: {
        preload: path.join(__dirname, "..", "preload", "index.js"),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
    },
}

export default WINDOW_CONFIG
