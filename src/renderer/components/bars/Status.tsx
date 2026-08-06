import { cn } from "@cybearl/cypack/frontend"
import useStatusBarStacking from "@renderer/hooks/useStatusBarStacking"
import type { ReactNode } from "react"
import StatusBarFrame from "@/renderer/components/frames/StatusBar"

type StatusBarProps = {
    caption: string
    children: ReactNode
    className?: string
}

export default function StatusBar({ caption, children, className }: StatusBarProps) {
    const { barRef, isStacked } = useStatusBarStacking()

    return (
        <div ref={barRef} className={cn("flex w-full shrink-0 flex-wrap items-stretch gap-0.5 pt-1", className)}>
            <StatusBarFrame label={caption} isGrowing className={cn(isStacked && "basis-full")} />
            {children}
        </div>
    )
}
