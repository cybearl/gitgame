import { type MouseEvent, type ReactNode, useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import styled from "styled-components"

/**
 * The Win95-styled tip, rendered through a portal with fixed positioning so it
 * escapes any scroll container's overflow clipping.
 */
const Tip = styled.div`
    position: fixed;
    z-index: 9999;
    padding: 4px 6px;
    border: 2px solid ${({ theme }) => theme.borderDarkest};
    background: ${({ theme }) => theme.tooltip};
    color: ${({ theme }) => theme.materialText};
    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.35);
    font-size: 1rem;
    line-height: 1.35;
    white-space: pre;
    pointer-events: none;
`

/**
 * The props for the `Tooltip` component.
 */
type TooltipProps = {
    text: string
    enterDelay?: number
    children: ReactNode
}

export default function Tooltip({ text, enterDelay = 300, children }: TooltipProps) {
    const timer = useRef<number>(undefined)

    const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

    /**
     * Shows the tip near the cursor after the enter delay elapses.
     * @param event The mouse event.
     */
    const handleEnter = useCallback(
        (event: MouseEvent) => {
            const x = event.clientX + 12
            const y = event.clientY + 16

            window.clearTimeout(timer.current)
            timer.current = window.setTimeout(() => setPosition({ x, y }), enterDelay)
        },
        [enterDelay],
    )

    /**
     * Keeps the tip anchored to the cursor while it moves over the target.
     * @param event The mouse event.
     */
    const handleMove = useCallback((event: MouseEvent) => {
        setPosition(previous => (previous ? { x: event.clientX + 12, y: event.clientY + 16 } : previous))
    }, [])

    /**
     * Cancels the pending tip and hides it.
     */
    const handleLeave = useCallback(() => {
        window.clearTimeout(timer.current)
        setPosition(null)
    }, [])

    return (
        <span className="inline-flex" onMouseEnter={handleEnter} onMouseMove={handleMove} onMouseLeave={handleLeave}>
            {children}

            {position && createPortal(<Tip style={{ left: position.x, top: position.y }}>{text}</Tip>, document.body)}
        </span>
    )
}
