import { useEffect, useState } from "react"
import type { CompileDbState } from "@/main/types/compileDb"

/**
 * Follows the compile-database watcher state broadcast by the main process,
 * subscribes before the first read so a transition landing mid-mount cannot be
 * missed.
 * @returns The current compile-database state, or `null` until the first read
 * resolves.
 */
export default function useCompileDbState(): CompileDbState | null {
    const [state, setState] = useState<CompileDbState | null>(null)

    useEffect(() => {
        let hasReceivedPush = false

        const unsubscribe = window.api.compileDb.onStateChange(next => {
            hasReceivedPush = true
            setState(next)
        })

        window.api.compileDb.getState().then(initial => {
            if (!hasReceivedPush) setState(initial)
        })

        return unsubscribe
    }, [])

    return state
}
