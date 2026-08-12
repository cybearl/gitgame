import AppRoot from "@renderer/components/layouts/AppRoot"
import MainLayout from "@renderer/components/layouts/main"
import usePreferencesDraft from "@renderer/hooks/usePreferencesDraft"
import { useCallback, useEffect, useState } from "react"
import { Button, Tab, TabBody, Tabs } from "react95"
import TitleBar from "@/renderer/components/bars/Title"
import AppearanceTab from "@/renderer/components/preferences/AppearanceTab"
import GeneralTab from "@/renderer/components/preferences/GeneralTab"
import ServicesTab from "@/renderer/components/preferences/ServicesTab"

/**
 * Which panel of the preferences window is on screen.
 */
type PreferencesTab = "general" | "appearance" | "services"

export default function PreferencesApp() {
    const { draft, isDirty, setField, apply } = usePreferencesDraft()
    const [tab, setTab] = useState<PreferencesTab>("general")

    /**
     * Closes the window, leaving any uncommitted edit behind.
     */
    const handleCancel = useCallback(() => {
        window.api.windows.close()
    }, [])

    /**
     * Commits the draft and closes the window.
     */
    const handleConfirm = useCallback(async () => {
        await apply()
        window.api.windows.close()
    }, [apply])

    // Confirm on enter, cancel on escape, consistent with every other window
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
        <AppRoot themeKey={draft.theme}>
            <MainLayout>
                <TitleBar title="Preferences" mode="dialog" onClose={handleCancel} />

                <div className="flex min-h-0 flex-1 flex-col p-4">
                    <Tabs value={tab} onChange={value => setTab(value as PreferencesTab)}>
                        <Tab value="general">General</Tab>
                        <Tab value="appearance">Appearance</Tab>
                        <Tab value="services">Services</Tab>
                    </Tabs>

                    <TabBody className="flex min-h-0 flex-1 flex-col overflow-auto">
                        {tab === "general" && <GeneralTab draft={draft} onChange={setField} />}
                        {tab === "appearance" && <AppearanceTab draft={draft} onChange={setField} />}
                        {tab === "services" && <ServicesTab draft={draft} onChange={setField} />}
                    </TabBody>

                    <div className="mt-4 flex shrink-0 justify-end gap-2">
                        <Button primary onClick={handleConfirm}>
                            OK
                        </Button>

                        <Button onClick={handleCancel}>Cancel</Button>

                        <Button disabled={!isDirty} onClick={apply}>
                            Apply
                        </Button>
                    </div>
                </div>
            </MainLayout>
        </AppRoot>
    )
}
