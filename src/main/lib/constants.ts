/**
 * The constants used throughout the application.
 */
const CONSTANTS = {
    titleBarHeight: 28,
    macOSTrafficLightsHeight: 14,
    macOSTitleBarLeftPadding: 80,
    ipc: {
        windowGetState: "window:get-state",
        windowStateChanged: "window:state-changed",
        windowMinimize: "window:minimize",
        windowMaximizeToggle: "window:maximize-toggle",
        windowClose: "window:close",
    },
} as const

export default CONSTANTS
