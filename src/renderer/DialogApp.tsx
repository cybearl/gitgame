import AppRoot from "@renderer/components/layouts/AppRoot"
import MainLayout from "@renderer/components/layouts/main"
import { useEffect, useState } from "react"
import type { DialogOptions } from "@/main/types/dialogs"
import TitleBar from "@/renderer/components/bars/Title"
import MessageDialog from "@/renderer/components/dialogs/Message"
import UpdateDialog from "@/renderer/components/dialogs/Update"

export default function DialogApp() {
    const [options, setOptions] = useState<DialogOptions | null>(null)

    // Fetch the options for this dialog window once, on mount
    useEffect(() => {
        window.api.dialogs.getOptions().then(setOptions)
    }, [])

    return (
        <AppRoot>
            <MainLayout>
                {options === null && <TitleBar title="" mode="dialog" />}

                {options?.variant === "update" && <UpdateDialog title={options.title} />}

                {(options?.variant === "confirm" ||
                    options?.variant === "message" ||
                    options?.variant === "error" ||
                    options?.variant === "error-with-details") && (
                    <MessageDialog options={options} variant={options.variant} />
                )}
            </MainLayout>
        </AppRoot>
    )
}
