import CONSTANTS from "@preload/lib/constants"
import type { AppSound } from "@/main/types/audio"

/**
 * The audio elements built so far, keyed by sound, so each file is only fetched
 * and decoded the first time it is asked for.
 */
const cachedSounds = new Map<AppSound, HTMLAudioElement>()

/**
 * Returns the preloaded audio element for the given system sound, building and
 * caching it on first use.
 * @param sound The sound to get the audio element for.
 * @returns The cached audio element.
 */
export function getSound(sound: AppSound): HTMLAudioElement {
    const cached = cachedSounds.get(sound)
    if (cached) return cached

    const audio = new Audio(CONSTANTS.SOUND_SOURCES[sound])
    audio.preload = "auto"
    cachedSounds.set(sound, audio)

    return audio
}
