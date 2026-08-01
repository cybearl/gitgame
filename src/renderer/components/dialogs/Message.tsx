import errorIcon from "@react95-icons/Hand_32x32_4.png"
import messageIcon from "@react95-icons/InfoBubble_32x32_4.png"
import { useCallback, useEffect, useMemo } from "react"
import { Button, Frame } from "react95"
import type { ConfirmDialogOptions } from "@/main/types/dialogs"
import TitleBar from "@/renderer/components/bars/Title"

type MessageDialogProps = {
    options: ConfirmDialogOptions
    variant: "confirm" | "message" | "error" | "error-with-details"
}

export default function MessageDialog({ options, variant }: MessageDialogProps) {
    /**
     * The icon standing in for the kind of message, with the plain confirm variant
     * carrying none.
     */
    const icon = useMemo(() => {
        if (variant === "confirm") return null
        return variant === "message" ? messageIcon : errorIcon
    }, [variant])

    /**
     * Responds to the dialog with a confirmation, closing the window.
     */
    const handleConfirm = useCallback(() => {
        window.api.dialogs.respond(true)
    }, [])

    /**
     * Responds to the dialog with a cancellation, closing the window.
     */
    const handleCancel = useCallback(() => {
        window.api.dialogs.respond(false)
    }, [])

    // Chime alongside the dialog rather than from the caller, so an error opened by
    // the main process (the updater) sounds the same as one raised by the renderer
    useEffect(() => {
        if (variant === "error" || variant === "error-with-details") window.api.audio.playError()
    }, [variant])

    // Confirm on enter, cancel on escape
    useEffect(() => {
        /**
         * Confirms on enter, cancels on escape.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") handleCancel()
            if (event.key === "Enter") handleConfirm()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [handleCancel, handleConfirm])

    return (
        <>
            <TitleBar title={options.title} mode="dialog" onClose={handleCancel} />

            <div className="flex min-h-0 flex-1 flex-col p-4">
                <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
                    {icon && (
                        <img
                            src={icon}
                            alt=""
                            decoding="sync"
                            fetchPriority="high"
                            className="size-8 shrink-0 [image-rendering:pixelated]"
                        />
                    )}

                    <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
                        <p className="text-sm whitespace-pre-wrap">{options.message}</p>

                        {options.details && (
                            <Frame variant="field" className="min-h-0 flex-1 overflow-auto p-1.5">
                                <p className="font-mono text-sm whitespace-pre-wrap">{options.details}</p>
                            </Frame>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex shrink-0 justify-end gap-2">
                    {variant === "confirm" && <Button onClick={handleCancel}>{options.cancelLabel ?? "Cancel"}</Button>}

                    <Button primary onClick={handleConfirm}>
                        {variant === "confirm" ? (options.confirmLabel ?? "OK") : "OK"}
                    </Button>
                </div>
            </div>
        </>
    )
}
