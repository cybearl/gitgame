import AppRoot from "@renderer/components/layouts/AppRoot"
import MainLayout from "@renderer/components/layouts/main"
import { useCallback, useEffect, useState } from "react"
import { Button } from "react95"
import type { DialogOptions } from "@/main/types/dialog"
import TitleBar from "@/renderer/components/bars/Title"

export default function DialogApp() {
    const [options, setOptions] = useState<DialogOptions | null>(null)

    /**
     * Responds to the dialog with a confirmation, closing the window.
     */
    const handleConfirm = useCallback(() => {
        window.api.dialog.respond(true)
    }, [])

    /**
     * Responds to the dialog with a cancellation, closing the window.
     */
    const handleCancel = useCallback(() => {
        window.api.dialog.respond(false)
    }, [])

    // Fetch the options for this dialog window once, on mount
    useEffect(() => {
        window.api.dialog.getOptions().then(setOptions)
    }, [])

    // Confirm on Enter, cancel on Escape
    useEffect(() => {
        /**
         * Confirms on Enter, cancels on Escape.
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
        <AppRoot>
            <MainLayout>
                <TitleBar title={options?.title ?? ""} mode="dialog" onClose={handleCancel} />

                <div className="flex min-h-0 flex-1 flex-col p-2">
                    <div className="min-h-0 flex-1 overflow-auto">
                        <p className="text-sm whitespace-pre-wrap">{options?.message}</p>

                        {options?.detail && <p className="mt-2 text-xs opacity-80">{options.detail}</p>}
                    </div>

                    <div className="mt-4 flex shrink-0 justify-end gap-2">
                        {options?.variant === "confirm" && (
                            <Button onClick={handleCancel}>{options?.cancelLabel ?? "Cancel"}</Button>
                        )}

                        <Button primary onClick={handleConfirm}>
                            {options?.variant === "confirm" ? (options?.confirmLabel ?? "OK") : "OK"}
                        </Button>
                    </div>
                </div>
            </MainLayout>
        </AppRoot>
    )
}
