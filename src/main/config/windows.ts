import path from "node:path"
import CONSTANTS from "@main/lib/constants"
import type { BrowserWindowConstructorOptions, WebPreferences } from "electron"

/**
 * The shared web preferences applied to every renderer window.
 */
const WEB_PREFERENCES: WebPreferences = {
    preload: path.join(__dirname, "..", "preload", "index.js"),
    sandbox: false,
    contextIsolation: true,
    nodeIntegration: false,
    autoplayPolicy: "no-user-gesture-required",
}

/**
 * The default `BrowserWindow` options for every window kind the app opens,
 * keyed by role.
 */
const WINDOWS_CONFIG: {
    main: BrowserWindowConstructorOptions
    dialog: BrowserWindowConstructorOptions
} = {
    main: {
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
        webPreferences: WEB_PREFERENCES,
    },
    dialog: {
        frame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        show: false,
        center: true,
        roundedCorners: false,
        webPreferences: WEB_PREFERENCES,
    },
}

export default WINDOWS_CONFIG
