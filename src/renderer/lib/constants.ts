/**
 * The constants for the renderer.
 */
const CONSTANTS = {
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
