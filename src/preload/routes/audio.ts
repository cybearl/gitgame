import type { GitgameApi } from "@preload/index"
import { getErrorAudio } from "@preload/lib/audio"

const audioApiRoutes: GitgameApi["audio"] = {
    playError: () => {
        const audio = getErrorAudio()
        audio.currentTime = 0
        audio.play().catch(() => null)
    },
}

export default audioApiRoutes
