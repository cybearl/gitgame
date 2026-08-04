import errorIcon from "@react95-icons/Hand_32x32_4.png"
import upToDateIcon from "@react95-icons/InfoBubble_32x32_4.png"
import updateIcon from "@react95-icons/Qfecheck111_32x32_4.png"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Frame, ProgressBar } from "react95"
import type { UpdaterState } from "@/main/types/updater"
import TitleBar from "@/renderer/components/bars/Title"
import Icon from "@/renderer/components/ui/Icon"
import { reportError } from "@/renderer/lib/utils/errors"
import {
    buildDownloadLabel,
    buildUpdaterDetails,
    buildUpdaterHeadline,
    convertReleaseBodyToReleaseNotes,
} from "@/renderer/lib/utils/updater"

type UpdateDialogProps = {
    title: string
}

export default function UpdateDialog({ title }: UpdateDialogProps) {
    const [state, setState] = useState<UpdaterState | null>(null)

    /**
     * The icon standing in for the current phase of the update.
     */
    const icon = useMemo(() => {
        if (state?.status === "error") return errorIcon
        if (state?.status === "not-available") return upToDateIcon
        return updateIcon
    }, [state?.status])

    /**
     * The headline of the current state.
     */
    const headline = useMemo(() => (state ? buildUpdaterHeadline(state) : ""), [state])

    /**
     * The details of the current state.
     */
    const details = useMemo(() => (state ? buildUpdaterDetails(state) : null), [state])

    /**
     * The release notes of the current state.
     */
    const releaseNotes = useMemo(
        () => convertReleaseBodyToReleaseNotes(state?.releaseNotes ?? null),
        [state?.releaseNotes],
    )

    /**
     * The label of the primary button, which is hidden while a check or a download
     * is running and there is nothing to act on yet.
     */
    const primaryLabel = useMemo(() => {
        if (state?.status === "downloaded") return "Restart Now"
        if (state?.status === "available") return state.canAutoInstall ? "Download Update" : "Open Releases Page"
        return "OK"
    }, [state?.status, state?.canAutoInstall])

    /**
     * Closes the dialog, leaving any running check or download to carry on in the
     * background.
     */
    const handleClose = useCallback(() => {
        window.api.windows.close()
    }, [])

    /**
     * Runs the action the current state offers: starting the download, opening the
     * releases page on the platforms that cannot install in place, restarting into
     * the staged version, or simply acknowledging the result.
     */
    const handlePrimary = useCallback(() => {
        if (!state) return

        if (state.status === "available") {
            if (state.canAutoInstall) {
                window.api.updater.download().catch(error => reportError("Failed to download the update", error))
            } else {
                window.api.shells.openExternal(state.releaseUrl)
                handleClose()
            }

            return
        }

        if (state.status === "downloaded") {
            window.api.updater.install()
            return
        }

        handleClose()
    }, [state, handleClose])

    // Follow the updater from the main process, subscribing before the first read
    // so a transition landing mid-mount cannot be missed
    useEffect(() => {
        let hasReceivedPush = false

        const unsubscribe = window.api.updater.onStateChange(next => {
            hasReceivedPush = true
            setState(next)
        })

        window.api.updater.getState().then(initial => {
            if (!hasReceivedPush) setState(initial)
        })

        return unsubscribe
    }, [])

    // Sound out the transitions worth hearing, keyed on the status alone so the
    // progress pushes of a running download cannot retrigger anything
    useEffect(() => {
        if (state?.status === "available") window.api.audio.play("chimes")
        if (state?.status === "downloaded") window.api.audio.play("tada")
        if (state?.status === "error") window.api.audio.play("chord")
    }, [state?.status])

    // Run the primary action on Enter, close on Escape
    useEffect(() => {
        /**
         * Runs the primary action on Enter, closes on Escape.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") handleClose()
            if (event.key === "Enter") handlePrimary()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [handleClose, handlePrimary])

    return (
        <>
            <TitleBar title={title} mode="dialog" onClose={handleClose} />

            <div className="flex min-h-0 flex-1 flex-col p-4">
                <div className="flex shrink-0 gap-4">
                    <Icon src={icon} size="md" />

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-sm font-bold">{headline}</p>
                        {details && <p className="text-sm whitespace-pre-wrap">{details}</p>}
                    </div>
                </div>

                {releaseNotes && (
                    <Frame variant="field" className="mt-3 min-h-0 flex-1 overflow-auto p-1.5">
                        <p className="text-sm whitespace-pre-wrap">{releaseNotes}</p>
                    </Frame>
                )}

                {state?.status === "downloading" && (
                    <div className="mt-3 flex shrink-0 flex-col gap-1">
                        <ProgressBar
                            variant="default"
                            value={Math.round(state.progress?.percent ?? 0)}
                            className="shrink-0 h-8!"
                        />

                        <span className="text-sm">
                            {state.progress ? buildDownloadLabel(state.progress) : "Starting the download..."}
                        </span>
                    </div>
                )}

                <div className="mt-auto flex shrink-0 justify-end gap-2 pt-4">
                    {(state?.status === "available" || state?.status === "downloaded") && (
                        <Button onClick={handleClose}>Later</Button>
                    )}

                    {state?.status === "checking" && <Button onClick={handleClose}>Cancel</Button>}
                    {state?.status === "downloading" && <Button onClick={handleClose}>Hide</Button>}

                    {state && state.status !== "checking" && state.status !== "downloading" && (
                        <Button primary onClick={handlePrimary}>
                            {primaryLabel}
                        </Button>
                    )}
                </div>
            </div>
        </>
    )
}
