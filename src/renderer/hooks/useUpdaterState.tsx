import { useEffect, useState } from "react"
import type { UpdaterState } from "@/main/types/updater"

/**
 * Follows the updater state broadcast by the main process, subscribing before the
 * first read so a transition landing mid-mount cannot be missed.
 * @returns The current updater state, or `null` until the first read resolves.
 */
export default function useUpdaterState(): UpdaterState | null {
    const [state, setState] = useState<UpdaterState | null>(null)

    useEffect(() => {
        let hasReceivedPush = false

        const unsubscribe = window.api.updater.onStateChange(next => {
            hasReceivedPush = true
            setState(next)
        })

        window.api.updater.getState().then(initial => {
            if (!hasReceivedPush) setState(initial)
        })

        return unsubscribe
    }, [])

    return state
}
