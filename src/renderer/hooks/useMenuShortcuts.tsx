import { useEffect } from "react"
import type { MenuAction, TopLevelMenu, TopLevelMenuEntry } from "@/renderer/config/menus"

/**
 * The parts of a keyboard combination, where `primary` is the platform's primary
 * modifier (Cmd on macOS, Ctrl elsewhere).
 */
type KeyCombo = {
    primary: boolean
    shift: boolean
    alt: boolean
    key: string
}

/**
 * Builds the canonical signature for a key combination (e.g. `"mod+shift+o"`),
 * used to match menu accelerators against keyboard events regardless of platform.
 * @param combo The key combination parts.
 * @returns The canonical signature string.
 */
function comboSignature(combo: KeyCombo): string {
    const segments: string[] = []

    if (combo.primary) segments.push("mod")
    if (combo.shift) segments.push("shift")
    if (combo.alt) segments.push("alt")
    segments.push(combo.key.toLowerCase())

    return segments.join("+")
}

/**
 * Parses a menu accelerator string (e.g. `"Ctrl+Shift+O"`) into a canonical
 * signature. `Ctrl`/`Cmd` both map to the primary modifier.
 * @param accelerator The accelerator string.
 * @returns The canonical signature string.
 */
function parseAccelerator(accelerator: string): string {
    const combo: KeyCombo = { primary: false, shift: false, alt: false, key: "" }

    for (const token of accelerator.split("+")) {
        switch (token.trim().toLowerCase()) {
            case "ctrl":
            case "cmd":
            case "cmdorctrl":
            case "mod":
                combo.primary = true
                break
            case "shift":
                combo.shift = true
                break
            case "alt":
            case "option":
                combo.alt = true
                break
            default:
                combo.key = token.trim()
        }
    }

    return comboSignature(combo)
}

/**
 * Collects the accelerator-to-action map from the menu tree, including only
 * enabled items that have both an accelerator and an action.
 * @param menus The menus to walk.
 * @returns A map from canonical signature to the action to dispatch.
 */
function collectShortcuts(menus: TopLevelMenu[]): Map<string, MenuAction> {
    const shortcuts = new Map<string, MenuAction>()

    /**
     * Recursively collects shortcuts from the menu entries.
     * @param entries The menu entries to walk.
     */
    const visit = (entries: TopLevelMenuEntry[]) => {
        for (const entry of entries) {
            if (entry.type === "submenu") {
                visit(entry.items)
            } else if (entry.type === "item" && entry.action && entry.accelerator && !entry.isDisabled) {
                shortcuts.set(parseAccelerator(entry.accelerator), entry.action)
            }
        }
    }

    for (const menu of menus) visit(menu.items)

    return shortcuts
}

/**
 * Returns whether the event target is an editable field that should keep its own
 * key handling (so shortcuts do not hijack typing).
 * @param target The event target.
 * @returns True if the target is an editable field.
 */
function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
}

/**
 * Binds the menu accelerators to their actions, dispatching the matching action
 * on the corresponding key combination. The `Ctrl` modifier matches Cmd on macOS
 * and Ctrl elsewhere.
 * @param menus The menus to derive shortcuts from.
 * @param onAction The dispatcher invoked with the matched action.
 */
export default function useMenuShortcuts(menus: TopLevelMenu[], onAction: (action: MenuAction) => void) {
    useEffect(() => {
        const shortcuts = collectShortcuts(menus)

        /**
         * Matches a keydown event against the collected shortcuts and dispatches.
         * @param event The keyboard event.
         */
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat || isEditableTarget(event.target)) return

            const signature = comboSignature({
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
