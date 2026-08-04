import { cn } from "@cybearl/cypack/frontend"
import CONSTANTS from "@/renderer/lib/constants"

type IconProps = {
    src: string
    alt?: string
    size?: keyof typeof CONSTANTS.ICON_SIZE_CLASSES
    isInline?: boolean
    className?: string
}

export default function Icon({ src, alt = "", size = "sm", isInline = false, className }: IconProps) {
    return (
        <img
            src={src}
            alt={alt}
            decoding="sync"
            fetchPriority="high"
            draggable={false}
            className={cn(
                "shrink-0 select-none [image-rendering:pixelated]",
                CONSTANTS.ICON_SIZE_CLASSES[size],
                isInline && CONSTANTS.ICON_INLINE_GUTTER_CLASS,
                isInline && "mb-0.5",
                className,
            )}
        />
    )
}
