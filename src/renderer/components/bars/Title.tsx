import { cn } from "@cybearl/cypack/frontend"
import CONSTANTS from "@main/lib/constants"
import Icon from "@renderer/components/ui/Icon"
import WindowGlyph from "@renderer/components/ui/WindowGlyph"
import useWindowStates from "@renderer/hooks/useWindowStates"
import type { CSSProperties } from "react"
import { Button } from "react95"

type TitleBarProps = {
    title: string
    icon?: string
    mode?: "full" | "dialog"
    onClose?: () => void
}

export default function TitleBar({ title, icon, mode = "full", onClose }: TitleBarProps) {
    const states = useWindowStates()

    return (
        <div
            className={cn(
                "z-10 flex shrink-0 items-center gap-8 select-none justify-between",
                states?.isFocused ? "bg-header text-header-text" : "bg-header-inactive text-header-not-active-text",
                window.api.platform.isMacOS ? "pr-1.5" : "px-1.5",
            )}
            style={
                {
                    height: CONSTANTS.titleBarHeight,
                    paddingLeft: window.api.platform.isMacOS ? CONSTANTS.macOSTitleBarLeftPadding : undefined,
                    WebkitAppRegion: "drag",
                } as CSSProperties
            }
            onDoubleClick={() => window.api.windows.toggleMaximize()}
        >
            <div className="flex min-w-0 flex-1 items-center overflow-hidden font-bold max-w-max">
                {icon && !window.api.platform.isMacOS && <Icon src={icon} isInline />}

                <span title={title} className="truncate text-base">
                    {title}
                </span>
            </div>

            {!window.api.platform.isMacOS && (
                <div className="flex" style={{ WebkitAppRegion: "no-drag" } as CSSProperties}>
                    {mode === "full" && (
                        <>
                            <Button
                                size="sm"
                                square
                                aria-label="Minimize"
                                onClick={() => window.api.windows.minimize()}
                                className="w-6! h-5.5! min-w-0!"
                            >
                                <WindowGlyph variant="minimize" />
                            </Button>
                            <Button
                                size="sm"
                                square
                                aria-label="Maximize"
                                onClick={() => window.api.windows.toggleMaximize()}
                                className="w-6! h-5.5! min-w-0!"
                            >
                                <WindowGlyph variant="maximize" />
                            </Button>
                        </>
                    )}

                    <Button
                        size="sm"
                        square
                        aria-label="Close"
                        onClick={() => (onClose ? onClose() : window.api.windows.close())}
                        className="w-6! h-5.5! min-w-0! ml-1"
                    >
                        <WindowGlyph variant="close" />
                    </Button>
                </div>
            )}
        </div>
    )
}
