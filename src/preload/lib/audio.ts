import errorSound from "@main/assets/sounds/error.mp3"

/**
 * The cached error-chime audio element.
 */
let errorAudio: HTMLAudioElement | null = null

/**
 * Returns the preloaded Win95 error chime.
 * @returns The cached error-chime audio element.
 */
export function getErrorAudio(): HTMLAudioElement {
    if (!errorAudio) {
        errorAudio = new Audio(errorSound)
        errorAudio.preload = "auto"
    }

    return errorAudio
}
