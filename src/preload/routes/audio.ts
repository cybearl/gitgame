import type { GitgameApi } from "@preload/index"
import { getSound } from "@preload/lib/audio"

const audioApiRoutes: GitgameApi["audio"] = {
    play: sound => {
        const audio = getSound(sound)
        audio.currentTime = 0
        audio.play().catch(() => null)
    },
}

export default audioApiRoutes
