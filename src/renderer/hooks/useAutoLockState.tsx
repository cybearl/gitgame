import { useEffect, useState } from "react"
import type { AutoLockState } from "@/main/types/autoLock"

/**
 * Follows the auto-lock loop state broadcast by the main process, subscribes
 * before the first read so a transition landing mid-mount cannot be missed.
 * @returns The current auto-lock state, or `null` until the first read resolves.
 */
export default function useAutoLockState(): AutoLockState | null {
    const [state, setState] = useState<AutoLockState | null>(null)

    useEffect(() => {
        let hasReceivedPush = false

        const unsubscribe = window.api.autoLock.onStateChange(next => {
            hasReceivedPush = true
            setState(next)
        })

        window.api.autoLock.getState().then(initial => {
            if (!hasReceivedPush) setState(initial)
        })

        return unsubscribe
    }, [])

    return state
}
