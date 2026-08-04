import { cn } from "@cybearl/cypack/frontend"
import downloadIcon from "@react95-icons/Download_16x16_4.png"
import Icon from "@renderer/components/ui/Icon"
import useUpdaterState from "@renderer/hooks/useUpdaterState"
import { buildUpdaterStatusLabel } from "@renderer/lib/utils/updater"
import { useCallback, useMemo } from "react"
import { Button, Frame, ProgressBar } from "react95"

type StatusUpdateFieldProps = {
    className?: string
}

export default function StatusUpdateField({ className }: StatusUpdateFieldProps) {
    const state = useUpdaterState()

    /**
     * The chip label matching the current state, `null` when there is nothing
     * pending on the updater and the chip should stay hidden.
     */
    const label = useMemo(() => (state ? buildUpdaterStatusLabel(state) : null), [state])

    /**
     * The download progress as a rounded percentage, `0` before the first
     * `download-progress` event lands so the bar starts empty.
     */
    const downloadPercent = Math.round(state?.progress?.percent ?? 0)

    /**
     * Runs the action that matches the current state, restart when the
     * installer is staged, download when it is only available, falls back to
     * opening the dialog so non-Windows platforms still have a path forward.
     */
    const handleAction = useCallback(() => {
        if (state?.status === "downloaded") {
            window.api.updater.install()
            return
        }

        if (state?.canAutoInstall) {
            window.api.updater.download()
            return
        }

        window.api.updater.openDialog()
    }, [state?.canAutoInstall, state?.status])

    if (!state || !label) return null

    return (
        <Frame
            variant="status"
            className={cn("flex items-center gap-2 p-2 text-xs min-w-48 max-w-1/2 overflow-hidden", className)}
        >
            <div className="min-w-0 flex-1 flex items-center pb-1">
                <Icon src={downloadIcon} isInline />
                <span className={cn("block truncate select-none", state.status === "downloaded" && "font-bold")}>
                    {label}
                </span>
            </div>

            {state.status === "downloading" ? (
                <ProgressBar variant="tile" value={downloadPercent} hideValue className="w-full! shrink-0 h-8!" />
            ) : (
                <Button variant="raised" size="sm" onClick={handleAction} className="w-full! h-8!">
                    {state.status === "downloaded" ? "Restart" : "Update"}
                </Button>
            )}
        </Frame>
    )
}
