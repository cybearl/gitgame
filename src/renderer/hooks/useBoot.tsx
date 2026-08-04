import { useProjectContext } from "@renderer/components/contexts/Project"
import { useEffect, useState } from "react"
import CONSTANTS from "@/renderer/lib/constants"

/**
 * The result of the `useBoot` hook.
 */
export type UseBootResult = {
    isBooting: boolean
    bootProgress: number
}

/**
 * Tracks the startup of the app, which runs until the project context is done with its
 * initial load and the boot screen has been up for its minimum duration, then sounds the
 * startup chime, a reload boots through instantly and silently.
 * @returns Whether the app is still booting, along with the boot progress as a percentage.
 */
export default function useBoot(): UseBootResult {
    const { isLoading } = useProjectContext()

    const [bootProgress, setBootProgress] = useState(window.api.app.isFirstLoad ? 0 : 100)

    const isBooting = window.api.app.isFirstLoad && (isLoading || bootProgress < 100)

    // Ramp the progress from a single interval started on mount, so the bar lands on
    // 100% exactly as the minimum duration runs out
    useEffect(() => {
        if (!window.api.app.isFirstLoad) return

        const startedAt = performance.now()

        const handle = window.setInterval(() => {
            const elapsed = performance.now() - startedAt
            const ratio = Math.min(1, elapsed / CONSTANTS.BOOT_SCREEN_MINIMUM_DURATION_MS)

            setBootProgress(Math.round(ratio * 100))
            if (ratio === 1) window.clearInterval(handle)
        }, CONSTANTS.BOOT_SCREEN_PROGRESS_TICK_MS)

        return () => window.clearInterval(handle)
    }, [])

    // Hand the boot screen over to the Win95 startup sound once it is done, from the main
    // window only so the dialog windows stay silent apart from their own chimes
    useEffect(() => {
        if (!window.api.app.isFirstLoad || isBooting) return
        window.api.audio.play("startup")
    }, [isBooting])

    return { isBooting, bootProgress }
}
