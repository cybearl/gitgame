import { useCallback, useEffect, useRef, useState } from "react"
import { Button, Separator } from "react95"
import MenuDropdown from "@/renderer/components/dropdowns/Menu"
import type { MenuAction, TopLevelMenu } from "@/renderer/config/menus"

type MenuBarProps = {
    menus: TopLevelMenu[]
    onAction: (action: MenuAction) => void
}

export default function MenuBar({ menus, onAction }: MenuBarProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    const [openIndex, setOpenIndex] = useState<number | null>(null)

    // Close the menu when clicking outside or pressing the escape key
    useEffect(() => {
        if (openIndex === null) return

        /**
         * Handles clicks outside the menu to close it.
         * @param event The mouse event.
         */
        const handleDocumentMouseDown = (event: MouseEvent) => {
            if (event.target && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpenIndex(null)
            }
        }

        /**
         * Handles keydown events to close the menu.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenIndex(null)
        }

        document.addEventListener("mousedown", handleDocumentMouseDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("mousedown", handleDocumentMouseDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [openIndex])

    /**
     * Handles mouse enter events on menu triggers.
     * @param index The index of the menu trigger.
     */
    const handleTriggerEnter = useCallback(
        (index: number) => {
            if (openIndex !== null && openIndex !== index) setOpenIndex(index)
        },
        [openIndex],
    )

    /**
     * Handles mouse leave events on menu triggers.
     */
    const closeAll = useCallback(() => setOpenIndex(null), [])

    return (
        <div className="w-full z-50">
            <div ref={containerRef} className="flex items-center px-0.5 py-0.5 gap-0.5">
                {menus.map((menu, index) => {
                    return (
                        <div key={menu.label} className="relative">
                            <Button
                                variant="menu"
                                size="sm"
                                active={openIndex === index}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                onMouseEnter={() => handleTriggerEnter(index)}
                                className="px-2! bg-secondary!"
                            >
                                {menu.label}
                            </Button>

                            {openIndex === index && (
                                <MenuDropdown items={menu.items} onAction={onAction} onDismiss={closeAll} />
                            )}
                        </div>
                    )
                })}
            </div>

            <Separator />
        </div>
    )
}
