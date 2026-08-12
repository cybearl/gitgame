import { cn } from "@cybearl/cypack/frontend"
import CONSTANTS from "@/renderer/lib/constants"

/**
 * Which of the three title bar controls a glyph draws.
 */
export type WindowGlyphVariant = keyof typeof CONSTANTS.WINDOW_GLYPH_RECTS

type WindowGlyphProps = {
    variant: WindowGlyphVariant
    className?: string
}

export default function WindowGlyph({ variant, className }: WindowGlyphProps) {
    return (
        <svg
            viewBox="0 0 12 10"
            width="12"
            height="10"
            fill="currentColor"
            shapeRendering="crispEdges"
            aria-hidden="true"
            focusable="false"
            className={cn("shrink-0 select-none", className)}
        >
            {CONSTANTS.WINDOW_GLYPH_RECTS[variant].map(([x, y, width, height]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} />
            ))}
        </svg>
    )
}
