import downloadIcon from "@react95-icons/Download_16x16_4.png"
import useUpdaterState from "@renderer/hooks/useUpdaterState"
import { buildUpdaterStatusLabel } from "@renderer/lib/utils/updater"
import { type MouseEvent, useCallback, useMemo } from "react"
import { Button } from "react95"
import StatusBarFrame from "@/renderer/components/frames/StatusBar"
import TileProgressBar from "@/renderer/components/ui/TileProgressBar"

export default function StatusUpdateField() {
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
    const downloadPercentage = useMemo(() => Math.round(state?.progress?.percent ?? 0), [state?.progress?.percent])

    /**
     * Opens the update dialog, the chip only advertises the version and the dialog is
     * where its release notes can be read before committing to the update.
     */
    const handleOpenDialog = useCallback(() => {
        window.api.updater.openDialog()
    }, [])

    /**
     * Runs the action that matches the current state.
     * @param event The click event, kept from reaching the chip behind the button so the
     * verb the user pressed is the one that runs.
     */
    const handleAction = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation()

            if (state?.status === "downloaded") {
                window.api.updater.install()
                return
            }

            if (state?.canAutoInstall) {
                window.api.updater.download()
                return
            }

            window.api.updater.openDialog()
        },
        [state?.canAutoInstall, state?.status],
    )

    if (!state || !label) return null

    return (
        <StatusBarFrame
            icon={downloadIcon}
            label={label}
            isLabelBold={state.status === "downloaded"}
            onClick={handleOpenDialog}
        >
            {state.status === "downloading" ? (
                <TileProgressBar value={downloadPercentage} hideValue />
            ) : (
                <Button variant="raised" size="sm" onClick={handleAction} className="w-full! h-8!">
                    {state.status === "downloaded" ? "Restart" : "Update"}
                </Button>
            )}
        </StatusBarFrame>
    )
}
