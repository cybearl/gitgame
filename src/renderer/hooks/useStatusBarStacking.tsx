import { computeStatusBarRowWidth } from "@renderer/lib/utils/statusBar"
import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import CONSTANTS from "@/renderer/lib/constants"

/**
 * The result of the `useStatusBarStacking` hook.
 */
export type UseStatusBarStackingResult = {
    barRef: RefObject<HTMLDivElement | null>
    isStacked: boolean
}

/**
 * Tracks whether a status bar still has the room to seat its caption and all of
 * its fields on a single row, measured rather than guessed from a breakpoint,
 * since the number of visible fields changes as the app runs.
 * @returns The ref to hand to the bar, along with whether it has to stack.
 */
export default function useStatusBarStacking(): UseStatusBarStackingResult {
    const barRef = useRef<HTMLDivElement>(null)

    const [isStacked, setIsStacked] = useState(false)

    /**
     * Measures the bar against the width its frames need.
     */
    const measure = useCallback(() => {
        if (!barRef.current) return

        const rowWidth = computeStatusBarRowWidth(barRef.current)
        setIsStacked(
            previous =>
                barRef.current!.clientWidth < rowWidth + (previous ? CONSTANTS.STATUS_BAR_STACKING_SLACK_PX : 0),
        )
    }, [])

    // Watch the bar's own size for the window being resized
    useLayoutEffect(() => {
        if (!barRef.current) return

        measure()

        const resizeObserver = new ResizeObserver(() => flushSync(measure))
        resizeObserver.observe(barRef.current)

        const mutationObserver = new MutationObserver(measure)
        mutationObserver.observe(barRef.current, { childList: true })

        return () => {
            resizeObserver.disconnect()
            mutationObserver.disconnect()
        }
    }, [measure])

    return { barRef, isStacked }
}
