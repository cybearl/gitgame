import { Checkbox, GroupBox, NumberInput, TextInput } from "react95"
import type { AppPreferences } from "@/main/types/store"
import PREFERENCES_CONFIG from "@/renderer/config/preferences"
import CONSTANTS from "@/renderer/lib/constants"
import { fromDisplayUnits, toDisplayUnits } from "@/renderer/lib/utils/preferences"

type ServicesTabProps = {
    draft: AppPreferences
    onChange: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void
}

export default function ServicesTab({ draft, onChange }: ServicesTabProps) {
    return (
        <div className="flex flex-col gap-3">
            <GroupBox label="Auto-lock">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: React95 renders the input inside, out of the linter's reach */}
                <label className="flex items-center gap-2 text-sm">
                    <span className="shrink-0">Reconcile every</span>

                    <NumberInput
                        width={90}
                        min={PREFERENCES_CONFIG.autoLockIntervalSeconds.min}
                        max={PREFERENCES_CONFIG.autoLockIntervalSeconds.max}
                        step={PREFERENCES_CONFIG.autoLockIntervalSeconds.step}
                        value={toDisplayUnits(draft.autoLockTickIntervalMs, CONSTANTS.MS_PER_SECOND)}
                        onChange={value =>
                            onChange("autoLockTickIntervalMs", fromDisplayUnits(value, CONSTANTS.MS_PER_SECOND))
                        }
                    />

                    <span className="shrink-0">seconds</span>
                </label>
            </GroupBox>

            <GroupBox label="Unreal Engine MCP">
                <div className="flex flex-col gap-2">
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: React95 renders the input inside, out of the linter's reach */}
                    <label className="flex items-center gap-2 text-sm">
                        <span className="w-16 shrink-0">Endpoint</span>

                        <TextInput
                            fullWidth
                            value={draft.mcpEndpoint}
                            onChange={event => onChange("mcpEndpoint", event.target.value)}
                        />
                    </label>

                    {/* biome-ignore lint/a11y/noLabelWithoutControl: React95 renders the input inside, out of the linter's reach */}
                    <label className="flex items-center gap-2 text-sm">
                        <span className="w-16 shrink-0">Probe</span>

                        <NumberInput
                            width={90}
                            min={PREFERENCES_CONFIG.mcpProbeIntervalSeconds.min}
                            max={PREFERENCES_CONFIG.mcpProbeIntervalSeconds.max}
                            step={PREFERENCES_CONFIG.mcpProbeIntervalSeconds.step}
                            value={toDisplayUnits(draft.mcpProbeIntervalMs, CONSTANTS.MS_PER_SECOND)}
                            onChange={value =>
                                onChange("mcpProbeIntervalMs", fromDisplayUnits(value, CONSTANTS.MS_PER_SECOND))
                            }
                        />

                        <span className="shrink-0">seconds</span>
                    </label>
                </div>
            </GroupBox>

            <GroupBox label="Updates">
                <div className="flex flex-col gap-2">
                    <Checkbox
                        label="Check for updates automatically"
                        checked={draft.isAutomaticUpdateCheckEnabled}
                        onChange={event => onChange("isAutomaticUpdateCheckEnabled", event.target.checked)}
                    />

                    {/* biome-ignore lint/a11y/noLabelWithoutControl: React95 renders the input inside, out of the linter's reach */}
                    <label className="flex items-center gap-2 text-sm">
                        <span className="shrink-0">Check every</span>

                        <NumberInput
                            width={90}
                            disabled={!draft.isAutomaticUpdateCheckEnabled}
                            min={PREFERENCES_CONFIG.updaterCheckIntervalHours.min}
                            max={PREFERENCES_CONFIG.updaterCheckIntervalHours.max}
                            step={PREFERENCES_CONFIG.updaterCheckIntervalHours.step}
                            value={toDisplayUnits(draft.updaterCheckIntervalMs, CONSTANTS.MS_PER_HOUR)}
                            onChange={value =>
                                onChange("updaterCheckIntervalMs", fromDisplayUnits(value, CONSTANTS.MS_PER_HOUR))
                            }
                        />

                        <span className="shrink-0">hours</span>
                    </label>
                </div>
            </GroupBox>
        </div>
    )
}
