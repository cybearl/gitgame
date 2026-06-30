import { useEffect, useState } from "react"
import type { WindowState } from "@/preload"

export default function useWindowStates() {
    const [states, setStates] = useState<WindowState>()

    // Subscribe to window state changes
    useEffect(() => {
        const unsubscribe = window.api.window.onStateChange(setStates)
        return () => unsubscribe()
    }, [])

    return states
}
