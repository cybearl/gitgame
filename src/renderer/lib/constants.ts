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
     * The delay between two boot progress updates.
     */
    BOOT_SCREEN_PROGRESS_TICK_MS: 128,

    /**
     * The delay between two status bar countdown-bar samples.
     */
    STATUS_BAR_TICK_MS: 200,

    /**
     * The extra width the status bar has to win back before its fields climb
     * from their own row up next to the caption again.
     */
    STATUS_BAR_STACKING_SLACK_PX: 16,

    /**
     * The top-left corner of each highlight dot in the Win95 sizer grip.
     */
    SIZER_GRIP_DOTS: [
        [10, 4],
        [6, 8],
        [10, 8],
        [2, 12],
        [6, 12],
        [10, 12],
    ],

    /**
     * How far the sizer grip's shadow dots sit below and to the right of the
     * highlight dots they shade.
     */
    SIZER_GRIP_SHADOW_OFFSET: 2,

    /**
     * How many milliseconds one second is worth, for the preference fields.
     */
    MS_PER_SECOND: 1000,

    /**
     * How many milliseconds one hour is worth, for the preference fields.
     */
    MS_PER_HOUR: 60 * 60 * 1000,

    /**
     * The rectangles making up each title bar control glyph, on the 12x10 grid they
     * are drawn on, as `[x, y, width, height]`.
     */
    WINDOW_GLYPH_RECTS: {
        minimize: [[2, 7, 7, 2]],
        maximize: [
            [1, 1, 10, 3],
            [1, 4, 1, 5],
            [10, 4, 1, 5],
            [1, 8, 10, 1],
        ],
        close: [
            [2, 1, 2, 2],
            [8, 1, 2, 2],
            [3, 2, 2, 2],
            [7, 2, 2, 2],
            [4, 3, 2, 2],
            [6, 3, 2, 2],
            [5, 4, 2, 2],
            [4, 5, 2, 2],
            [6, 5, 2, 2],
            [3, 6, 2, 2],
            [7, 6, 2, 2],
            [2, 7, 2, 2],
            [8, 7, 2, 2],
        ],
    },

    /**
     * External resources opened from the `Help` menu.
     */
    EXTERNAL_LINKS: {
        documentation: "https://github.com/cybearl/gitgame/blob/main/README.md",
        reportIssue: "https://github.com/cybearl/gitgame/issues",
    },

    /**
     * The label of the menu item revealing the project folder, per platform.
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
