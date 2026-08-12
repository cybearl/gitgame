import path from "node:path"
import appIcon from "@main/assets/icon.png?asset"
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
 * The shared shape of every window that is not the main one, frameless, fixed
 * size and centered, each role adds only what makes it its own.
 */
const SECONDARY_WINDOW: BrowserWindowConstructorOptions = {
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    center: true,
    roundedCorners: false,
    icon: appIcon,
    webPreferences: WEB_PREFERENCES,
}

/**
 * The default `BrowserWindow` options for every window kind the app opens,
 * keyed by role.
 */
const WINDOWS_CONFIG: {
    main: BrowserWindowConstructorOptions
    dialog: BrowserWindowConstructorOptions
    preferences: BrowserWindowConstructorOptions
} = {
    main: {
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 640,
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
        icon: appIcon,
        webPreferences: WEB_PREFERENCES,
    },
    // Sized per variant by the dialogs service, from `DIALOGS_CONFIG`
    dialog: SECONDARY_WINDOW,
    preferences: {
        ...SECONDARY_WINDOW,
        width: 640,
        height: 560,
    },
}

export default WINDOWS_CONFIG
