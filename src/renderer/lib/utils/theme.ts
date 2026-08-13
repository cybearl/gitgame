import type { Theme } from "react95/dist/common/themes/types"
import CONSTANTS from "@/renderer/lib/constants"

/**
 * Converts a camelCase theme token name into its kebab-case custom property suffix.
 * @param token The camelCase token name.
 * @returns The kebab-case suffix.
 */
function toKebabCase(token: string): string {
    return token.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}

/**
 * Draws one diagonal of the sizer grip.
 * @param color The fill color of the dots.
 * @param offset How far to shift every dot down and to the right.
 * @returns The `rect` elements making up the diagonal.
 */
function buildSizerGripDots(color: string, offset: number): string {
    const rects = CONSTANTS.SIZER_GRIP_DOTS.map(
        ([x, y]) => `<rect x="${x + offset}" y="${y + offset}" width="2" height="2"/>`,
    ).join("")

    return `<g fill="${color}">${rects}</g>`
}

/**
 * Builds the classic Win95 sizer grip drawn in the `ScrollView` corner, tinted
 * with the active theme's border colors.
 * @param theme The active react95 theme.
 * @returns The pattern as a CSS `url()` value.
 */
export function buildSizerGripUrl(theme: Theme): string {
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges">' +
        buildSizerGripDots(theme.borderLightest, 0) +
        buildSizerGripDots(theme.borderDark, CONSTANTS.SIZER_GRIP_SHADOW_OFFSET) +
        "</svg>"

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Builds the `--color-*` declarations mirroring a react95 theme, so Tailwind
 * utilities and plain CSS rules follow the active theme without either of them
 * having to reach into styled-components.
 * @param theme The active react95 theme.
 * @returns The declaration block, one custom property per line.
 */
export function buildThemeVariables(theme: Theme): string {
    return Object.entries(theme)
        .filter(([token, value]) => token !== "name" && typeof value === "string")
        .map(([token, value]) => `--color-${toKebabCase(token)}: ${value};`)
        .join("\n")
}
