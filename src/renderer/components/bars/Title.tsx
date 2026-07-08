import { cn } from "@cybearl/cypack/frontend"
import CONSTANTS from "@main/lib/constants"
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
                states?.isFocused ? "bg-active text-primary" : "bg-inactive text-secondary",
                window.api.platform.isMacOS ? "pr-1.5" : "px-1.5",
            )}
            style={
                {
                    height: CONSTANTS.titleBarHeight,
                    paddingLeft: window.api.platform.isMacOS ? CONSTANTS.macOSTitleBarLeftPadding : undefined,
                    WebkitAppRegion: "drag",
                } as CSSProperties
            }
            onDoubleClick={() => window.api.window.toggleMaximize()}
        >
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden font-bold max-w-max">
                {icon && !window.api.platform.isMacOS && (
                    <img src={icon} alt="" className="size-4 [image-rendering:pixelated]" />
                )}

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
                                onClick={() => window.api.window.minimize()}
                                className="w-6! h-5.5! min-w-0!"
                            >
                                <img src="./assets/icons/window/minimize.png" alt="minimize" className="w-4" />
                            </Button>
                            <Button
                                size="sm"
                                square
                                aria-label="Maximize"
                                onClick={() => window.api.window.toggleMaximize()}
                                className="w-6! h-5.5! min-w-0!"
                            >
                                <img src="./assets/icons/window/maximize.png" alt="maximize" className="w-4" />
                            </Button>
                        </>
                    )}

                    <Button
                        size="sm"
                        square
                        aria-label="Close"
                        onClick={() => (onClose ? onClose() : window.api.window.close())}
                        className="w-6! h-5.5! min-w-0! ml-1"
                    >
                        <img src="./assets/icons/window/close.png" alt="close" className="w-4 " />
                    </Button>
                </div>
            )}
        </div>
    )
}
