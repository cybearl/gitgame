import { useEffect, useState } from "react"
import type { McpState } from "@/main/types/mcp"

/**
 * Follows the MCP connection state broadcast by the main process, subscribing
 * before the first read so a transition landing mid-mount cannot be missed.
 * @returns The current MCP state, or `null` until the first read resolves.
 */
export default function useMcpState(): McpState | null {
    const [state, setState] = useState<McpState | null>(null)

    useEffect(() => {
        let hasReceivedPush = false

        const unsubscribe = window.api.mcp.onStateChange(next => {
            hasReceivedPush = true
            setState(next)
        })

        window.api.mcp.getState().then(initial => {
            if (!hasReceivedPush) setState(initial)
        })

        return unsubscribe
    }, [])

    return state
}
