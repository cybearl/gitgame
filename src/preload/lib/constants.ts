import chimesSound from "@main/assets/sounds/chimes.wav"
import chordSound from "@main/assets/sounds/chord.wav"
import dingSound from "@main/assets/sounds/ding.wav"
import startupSound from "@main/assets/sounds/startup.wav"
import tadaSound from "@main/assets/sounds/tada.wav"
import type { AppSound } from "@/main/types/audio"

/**
 * The constants for the preload script.
 */
const CONSTANTS = {
    /**
     * The bundled URL of every playable system sound, keyed by the name the
     * renderer asks for it under.
     */
    SOUND_SOURCES: {
        chimes: chimesSound,
        chord: chordSound,
        ding: dingSound,
        startup: startupSound,
        tada: tadaSound,
    } as Record<AppSound, string>,
} as const

export default CONSTANTS
