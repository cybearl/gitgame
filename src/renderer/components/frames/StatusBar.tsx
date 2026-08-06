import { cn } from "@cybearl/cypack/frontend"
import type { ReactNode } from "react"
import { Frame } from "react95"
import Icon from "@/renderer/components/ui/Icon"

/**
 * The tone a status field's label takes, `pending` for an operation still on
 * its way and `muted` for a field the app cannot act on right now.
 */
export type StatusBarLabelState = "default" | "pending" | "muted"

type StatusBarFrameProps = {
    icon?: string
    label: string
    labelState?: StatusBarLabelState
    isLabelBold?: boolean
    isGrowing?: boolean
    children?: ReactNode
    className?: string
    onClick?: () => void
}

export default function StatusBarFrame({
    icon,
    label,
    labelState = "default",
    isLabelBold,
    isGrowing,
    children,
    className,
    onClick,
}: StatusBarFrameProps) {
    return (
        <Frame
            variant="status"
            className={cn(
                "flex items-center gap-2 p-2 text-xs basis-48 min-w-48 overflow-hidden",
                isGrowing ? "grow-999" : "grow",
                onClick && "cursor-pointer",
                className,
            )}
            onClick={onClick}
        >
            <div className={cn("min-w-0 flex-1 flex items-center pb-1", labelState !== "default" && "opacity-60")}>
                {icon && (
                    <Icon
                        src={icon}
                        isInline
                        className={cn(
                            labelState !== "default" && "grayscale",
                            labelState === "pending" && "animate-pulse",
                        )}
                    />
                )}

                <span className={cn("block truncate select-none", isLabelBold && "font-bold")}>{label}</span>
            </div>

            {children}
        </Frame>
    )
}
