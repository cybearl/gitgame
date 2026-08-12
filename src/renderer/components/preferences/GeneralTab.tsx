import { GroupBox, Radio } from "react95"
import type { AppPreferences, StartupBehavior } from "@/main/types/store"

type GeneralTabProps = {
    draft: AppPreferences
    onChange: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void
}

export default function GeneralTab({ draft, onChange }: GeneralTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <GroupBox label="On startup">
                <div className="flex flex-col gap-2">
                    <Radio
                        name="startupBehavior"
                        value="reopen-last"
                        label="Reopen the last project"
                        checked={draft.startupBehavior === "reopen-last"}
                        onChange={event => onChange("startupBehavior", event.target.value as StartupBehavior)}
                    />

                    <Radio
                        name="startupBehavior"
                        value="start-clean"
                        label="Start with no project open"
                        checked={draft.startupBehavior === "start-clean"}
                        onChange={event => onChange("startupBehavior", event.target.value as StartupBehavior)}
                    />
                </div>
            </GroupBox>
        </div>
    )
}
