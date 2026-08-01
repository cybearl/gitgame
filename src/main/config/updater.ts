/**
 * The configuration options for the auto-updater.
 */

const UPDATER_CONFIG = {
    checkIntervalMs: 4 * 60 * 60 * 1000,
    startupCheckDelayMs: 15 * 1000,
    releasesUrl: "https://github.com/cybearl/gitgame/releases/latest",
    autoInstallPlatforms: ["win32"] as NodeJS.Platform[],
    simulatedDownload: {
        version: "9.9.9",
        totalBytes: 86 * 1024 * 1024,
        tickMs: 120,
        tickPercent: 4,
    },
}

export default UPDATER_CONFIG
