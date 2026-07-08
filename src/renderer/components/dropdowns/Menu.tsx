import { cn } from "@cybearl/cypack/frontend"
import { useCallback, useState } from "react"
import { MenuList, MenuListItem, Separator } from "react95"
import type { MenuAction, TopLevelMenuEntry } from "@/renderer/config/menus"

type MenuDropdownProps = {
    items: TopLevelMenuEntry[]
    onAction: (action: MenuAction) => void
    onDismiss: () => void
    className?: string
}

export default function MenuDropdown({ items, onAction, onDismiss, className }: MenuDropdownProps) {
    const [openSubmenu, setOpenSubmenu] = useState<number | null>(null)

    /**
     * Render a single non-submenu menu entry inside a dropdown.
     * @param entry The entry to render. Submenu entries are ignored and return `null`.
     * @param index Stable index used as a fallback React key.
     * @param onDismiss Invoked after an actionable item runs so the menu chain can close.
     * @returns The rendered element, or `null` if the entry is a submenu.
     */
    const renderLeafItem = useCallback(
        (entry: TopLevelMenuEntry, index: number, onDismiss: () => void) => {
            if (entry.type === "separator") {
                return <Separator key={`separator-${index}`} />
            }

            if (entry.type === "submenu") return null

            return (
                <MenuListItem
                    key={`item-${index}`}
                    disabled={entry.isDisabled}
                    className="flex! items-center! justify-between! gap-4!"
                    onClick={() => {
                        if (entry.isDisabled) return
                        if (entry.action) onAction(entry.action)

                        onDismiss()
                    }}
                >
                    <span>{entry.label}</span>
                    {entry.accelerator && <span className="text-xs opacity-60">{entry.accelerator}</span>}
                </MenuListItem>
            )
        },
        [onAction],
    )

    return (
        <MenuList shadow className={cn("absolute! top-full! left-0! z-50! mt-0.5 min-w-55", className)}>
            {items.map((entry, index) => {
                if (entry.type === "separator") {
                    return <Separator key={`separator-${index}`} />
                }

                if (entry.type === "submenu") {
                    return (
                        <div
                            key={entry.label}
                            className="relative"
                            onMouseEnter={() => setOpenSubmenu(index)}
                            onMouseLeave={() => setOpenSubmenu(null)}
                        >
                            <MenuListItem className="flex! items-center! justify-between! gap-4!">
                                <span>{entry.label}</span>
                                <span className="text-xs">▸</span>
                            </MenuListItem>

                            {openSubmenu === index && (
                                <MenuList shadow className="absolute! top-0! left-full! z-50! ml-0.5 min-w-55">
                                    {entry.items.map((sub, subIndex) => renderLeafItem(sub, subIndex, onDismiss))}
                                </MenuList>
                            )}
                        </div>
                    )
                }

                return renderLeafItem(entry, index, onDismiss)
            })}
        </MenuList>
    )
}
