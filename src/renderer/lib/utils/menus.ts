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
export function buildComboSignature(combo: KeyCombo): string {
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

    return buildComboSignature(combo)
}

/**
 * Collects the accelerator-to-action map from the menu tree, including only
 * enabled items that have both an accelerator and an action.
 * @param menus The menus to walk.
 * @returns A map from canonical signature to the action to dispatch.
 */
export function collectMenuShortcuts(menus: TopLevelMenu[]): Map<string, MenuAction> {
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
export function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
}

/**
 * Builds the fake per-file lock failures shown by the `Dev Tools` error dialog, so
 * the details pane can be previewed with realistic content.
 * @returns The failures as one line each.
 */
export function buildDevToolsLockFailures(): string {
    return [
        "Content/Characters/Hero/BP_Hero.uasset: locked by john",
        "Content/Characters/Hero/SK_Hero.uasset: locked by jane",
        "Content/Maps/MainMenu.umap: locked by bob",
        "Content/UI/HUD/WBP_HUD.uasset: locked by alice",
        "Content/VFX/P_Explosion.uasset",
    ].join("\n")
}
