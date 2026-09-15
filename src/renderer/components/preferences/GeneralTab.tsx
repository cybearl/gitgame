import { GroupBox, Radio, TextInput } from "react95"
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

            <GroupBox label="Code editor">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: React95 renders the input inside, out of the linter's reach */}
                <label className="flex items-center gap-2 text-sm">
                    <span className="w-16 shrink-0">Editor</span>

                    <TextInput
                        fullWidth
                        placeholder="Detected automatically, set a path to override it"
                        value={draft.codeEditorPath}
                        onChange={event => onChange("codeEditorPath", event.target.value)}
                    />
                </label>
            </GroupBox>
        </div>
    )
}
