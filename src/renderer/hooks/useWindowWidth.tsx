import { useEffect, useState } from "react"

/**
 * Tracks the width of the window, so a layout that sizes itself against it keeps
 * up with the user resizing it.
 * @returns The current window width, in pixels.
 */
export default function useWindowWidth(): number {
    const [width, setWidth] = useState(() => window.innerWidth)

    // Sample the width again on every resize, the window carries no state change for
    // it and the initial read would otherwise stand for the whole session
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return width
}
