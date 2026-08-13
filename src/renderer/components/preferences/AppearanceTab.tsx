import { cn } from "@cybearl/cypack/frontend"
import { ScrollView } from "react95"
import type { AppPreferences } from "@/main/types/store"
import { THEME_GROUPS } from "@/renderer/config/themes"

type AppearanceTabProps = {
    draft: AppPreferences
    onChange: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void
}

export default function AppearanceTab({ draft, onChange }: AppearanceTabProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <p className="shrink-0 text-sm">
                Theme, this window repaints as you pick so you can see it before you commit.
            </p>

            <ScrollView className="min-h-0 flex-1">
                <div className="flex flex-col py-0.5">
                    {THEME_GROUPS.map(group => (
                        <div key={group.label} className="flex flex-col">
                            <span className="px-2 pt-2 pb-1 text-sm font-bold text-material-text-disabled">
                                {group.label}
                            </span>

                            {group.keys.map(key => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => onChange("theme", key)}
                                    className={cn(
                                        "cursor-pointer px-2 py-0.5 text-left text-sm",
                                        draft.theme === key && "bg-header text-header-text",
                                    )}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </ScrollView>
        </div>
    )
}
