/**
 * The constants for the renderer.
 */
const CONSTANTS = {
    /**
     * The unit suffixes used when formatting a byte count.
     */
    BYTE_UNITS: ["B", "KB", "MB", "GB"],

    /**
     * The Tailwind sizing classes for each icon scale.
     */
    ICON_SIZE_CLASSES: {
        sm: "size-4",
        md: "size-8",
        lg: "size-16",
        none: "",
    },

    /**
     * The gutter an inline icon keeps between itself and the label that follows it.
     */
    ICON_INLINE_GUTTER_CLASS: "mr-2",

    /**
     * The shortest time the boot screen stays up.
     */
    BOOT_SCREEN_MINIMUM_DURATION_MS: 1024,

    /**
     * The delay between two boot progress updates, coarse enough to keep the tiled
     * progress bar from repainting faster than a tile can appear.
     */
    BOOT_SCREEN_PROGRESS_TICK_MS: 128,

    /**
     * The delay between two status bar countdown-bar samples, small enough to
     * look smooth against the 5-10 second service intervals without wasting
     * cycles when nothing else is happening.
     */
    STATUS_BAR_TICK_MS: 200,

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
