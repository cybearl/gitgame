import { cn } from "@cybearl/cypack/frontend"
import type { ReactNode } from "react"
import { Frame } from "react95"

type StatusBarFieldProps = {
    children: ReactNode
    grow?: boolean
    className?: string
}

export default function StatusBarField({ children, grow, className }: StatusBarFieldProps) {
    return (
        <Frame
            variant="status"
            className={cn("flex min-w-0 items-center px-2 py-0.5 text-xs", grow && "flex-1", className)}
        >
            <span className="truncate">{children}</span>
        </Frame>
    )
}
