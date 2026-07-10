import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import { type MouseEvent, useEffect } from "react"
import { MenuList, MenuListItem, Separator } from "react95"

export default function TreeViewContextMenu() {
    const { menu, matches, dismissMenu, lockFromMenu, unlockFromMenu, forceUnlockFromMenu, revealFromMenu } =
        useTreeViewContext()

    // Dismiss the menu on any outside click or when the escape key is pressed
    useEffect(() => {
        if (!menu) return

        /**
         * Dismisses the menu on a pointer press anywhere in the document.
         */
        const handlePointerDown = () => dismissMenu()

        /**
         * Dismisses the menu when the escape key is pressed.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") dismissMenu()
        }

        document.addEventListener("mousedown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [menu, dismissMenu])

    if (!menu) return null

    return (
        <MenuList
            shadow
            className="fixed! z-50! min-w-40"
            style={{ left: menu.x, top: menu.y }}
            onMouseDown={(event: MouseEvent<HTMLUListElement>) => event.stopPropagation()}
        >
            <MenuListItem disabled={!menu.canLock} onClick={lockFromMenu}>
                Lock
            </MenuListItem>

            <MenuListItem disabled={menu.minePaths.length === 0} onClick={unlockFromMenu}>
                Unlock
            </MenuListItem>

            {menu.othersPaths.length > 0 && (
                <>
                    <Separator />
                    <MenuListItem onClick={forceUnlockFromMenu}>Force unlock</MenuListItem>
                </>
            )}

            {matches !== null && (
                <>
                    <Separator />
                    <MenuListItem onClick={revealFromMenu}>Reveal in tree</MenuListItem>
                </>
            )}
        </MenuList>
    )
}
