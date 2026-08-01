import { useEffect } from "react"
import type { MenuAction, TopLevelMenu } from "@/renderer/config/menus"
import { buildComboSignature, collectMenuShortcuts, isEditableTarget } from "@/renderer/lib/utils/menus"

/**
 * Binds the menu accelerators to their actions, dispatching the matching action
 * on the corresponding key combination.
 * @param menus The menus to derive shortcuts from.
 * @param onAction The dispatcher invoked with the matched action.
 */
export default function useMenuShortcuts(menus: TopLevelMenu[], onAction: (action: MenuAction) => void) {
    useEffect(() => {
        const shortcuts = collectMenuShortcuts(menus)

        /**
         * Matches a keydown event against the collected shortcuts and dispatches.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat || isEditableTarget(event.target)) return

            const signature = buildComboSignature({
                primary: window.api.platform.isMacOS ? event.metaKey : event.ctrlKey,
                shift: event.shiftKey,
                alt: event.altKey,
                key: event.key,
            })

            const action = shortcuts.get(signature)
            if (!action) return

            event.preventDefault()
            onAction(action)
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [menus, onAction])
}
