import { useEffect, useState } from "react"
import { Button, Window, WindowContent, WindowHeader } from "react95"
import originalTheme from "react95/dist/themes/original"
import { ThemeProvider } from "styled-components"
import type { DialogOptions } from "@/main/types/dialog"

export default function DialogApp() {
    const [options, setOptions] = useState<DialogOptions | null>(null)

    // Fetch the options for this dialog window once, on mount
    useEffect(() => {
        window.api.dialog.getOptions().then(setOptions)
    }, [])

    // Respond to the confirm/cancel keyboard shortcuts
    useEffect(() => {
        /**
         * Confirms on Enter, cancels on Escape.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") window.api.dialog.respond(false)
            if (event.key === "Enter") window.api.dialog.respond(true)
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    const isConfirm = options?.variant === "confirm"

    return (
        <ThemeProvider theme={originalTheme}>
            <Window className="flex! h-screen! w-screen! flex-col">
                <WindowHeader className="flex! items-center! justify-between! [-webkit-app-region:drag]">
                    <span className="truncate">{options?.title}</span>

                    <Button
                        size="sm"
                        square
                        className="[-webkit-app-region:no-drag]"
                        onClick={() => window.api.dialog.respond(false)}
                    >
                        <span className="font-bold">×</span>
                    </Button>
                </WindowHeader>

                <WindowContent className="flex! min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-auto">
                        <p className="text-sm whitespace-pre-wrap">{options?.message}</p>

                        {options?.detail && <p className="mt-2 text-xs opacity-80">{options.detail}</p>}
                    </div>

                    <div className="mt-4 flex shrink-0 justify-end gap-2">
                        {isConfirm && (
                            <Button onClick={() => window.api.dialog.respond(false)}>
                                {options?.cancelLabel ?? "Cancel"}
                            </Button>
                        )}

                        <Button primary onClick={() => window.api.dialog.respond(true)}>
                            {isConfirm ? (options?.confirmLabel ?? "OK") : "OK"}
                        </Button>
                    </div>
                </WindowContent>
            </Window>
        </ThemeProvider>
    )
}
