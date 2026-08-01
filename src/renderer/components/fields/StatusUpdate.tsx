import { cn } from "@cybearl/cypack/frontend"
import Tooltip from "@renderer/components/ui/Tooltip"
import useUpdaterState from "@renderer/hooks/useUpdaterState"
import { useCallback, useMemo } from "react"
import { Frame } from "react95"
import { buildUpdaterStatusLabel } from "@/renderer/lib/utils/updater"

type StatusUpdateFieldProps = {
    className?: string
}

export default function StatusUpdateField({ className }: StatusUpdateFieldProps) {
    const state = useUpdaterState()

    /**
     * The pending update advertised in the status bar, or `null` when there is
     * nothing waiting on the user.
     */
    const label = useMemo(() => (state ? buildUpdaterStatusLabel(state) : null), [state])

    /**
     * Brings the update dialog back up, without starting another check.
     */
    const handleClick = useCallback(() => {
        window.api.updater.openDialog()
    }, [])

    if (!label) return null

    return (
        <Tooltip
            text={
                state?.status === "downloaded"
                    ? "The update is downloaded, restart to apply it"
                    : "Open the update dialog"
            }
        >
            <Frame
                variant="status"
                className={cn("flex min-w-0 cursor-pointer items-center px-2 py-0.5 text-xs", className)}
                onClick={handleClick}
            >
                <span className={cn("truncate select-none", state?.status === "downloaded" && "font-bold")}>
                    {label}
                </span>
            </Frame>
        </Tooltip>
    )
}
