import { type MouseEvent, useEffect } from "react"
import { MenuList, MenuListItem, Separator } from "react95"

/**
 * The props for the tree `ContextMenu` component.
 */
type ContextMenuProps = {
    x: number
    y: number
    canLock: boolean
    mineCount: number
    othersCount: number
    onLock: () => void
    onUnlock: () => void
    onForceUnlock: () => void
    onDismiss: () => void
}

export default function ContextMenu({
    x,
    y,
    canLock,
    mineCount,
    othersCount,
    onLock,
    onUnlock,
    onForceUnlock,
    onDismiss,
}: ContextMenuProps) {
    // Dismiss the menu on any outside click or when the escape key is pressed
    useEffect(() => {
        /**
         * Dismisses the menu on a pointer press anywhere in the document.
         */
        const handlePointerDown = () => onDismiss()

        /**
         * Dismisses the menu when the escape key is pressed.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onDismiss()
        }

        document.addEventListener("mousedown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [onDismiss])

    return (
        <MenuList
            shadow
            className="fixed! z-50! min-w-40"
            style={{ left: x, top: y }}
            onMouseDown={(event: MouseEvent<HTMLUListElement>) => event.stopPropagation()}
        >
            <MenuListItem disabled={!canLock} onClick={onLock}>
                Lock
            </MenuListItem>

            <MenuListItem disabled={mineCount === 0} onClick={onUnlock}>
                Unlock
            </MenuListItem>

            {othersCount > 0 && (
                <>
                    <Separator />

                    <MenuListItem onClick={onForceUnlock}>Force unlock</MenuListItem>
                </>
            )}
        </MenuList>
    )
}
