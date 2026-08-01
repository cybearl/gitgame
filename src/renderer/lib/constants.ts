/**
 * The constants for the renderer.
 */
const CONSTANTS = {
    /**
     * The unit suffixes used when formatting a byte count.
     */
    BYTE_UNITS: ["B", "KB", "MB", "GB"],

    /**
     * External resources opened from the `Help` menu.
     */
    EXTERNAL_LINKS: {
        documentation: "https://github.com/cybearl/gitgame/blob/main/README.md",
        reportIssue: "https://github.com/cybearl/gitgame/issues",
    },

    /**
     * The label of the menu item revealing the project folder, per platform, so the
     * wording names the file manager the user actually gets, platforms without an entry
     * fall back to `DEFAULT_FILE_MANAGER_LABEL`.
     */
    FILE_MANAGER_LABELS: {
        win32: "Show in Explorer",
        darwin: "Reveal in Finder",
    } as Record<string, string>,

    /**
     * The label used where the platform's file manager has no established name of its own.
     */
    DEFAULT_FILE_MANAGER_LABEL: "Show in File Manager",

    /**
     * Short human-readable messages for each `OpenProjectFailureReason`, shown as the
     * message line of the error-with-details dialog when opening a project fails.
     */
    PROJECT_OPEN_FAILURE_MESSAGES: {
        "not-found": "The folder no longer exists on disk.",
        "not-a-repository": "That folder isn't a Git repository.",
        "not-a-ue-project": "That folder isn't an Unreal Engine project.",
    },
} as const

export default CONSTANTS
