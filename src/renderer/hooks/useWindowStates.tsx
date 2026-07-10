import { useEffect, useState } from "react"
import type { WindowState } from "@/preload"

export default function useWindowStates() {
    const [states, setStates] = useState<WindowState>()

    // Fetch the initial state on mount and subscribe to subsequent changes so
    // the first render already reflects the actual window focus
    useEffect(() => {
        let cancelled = false

        window.api.windows.getState().then(state => {
            if (!cancelled) setStates(state)
        })

        const unsubscribe = window.api.windows.onStateChange(setStates)

        return () => {
            cancelled = true
            unsubscribe()
        }
    }, [])

    return states
}
