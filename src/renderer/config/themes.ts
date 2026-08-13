import type { Theme } from "react95/dist/common/themes/types"
import themes from "react95/dist/themes"

/**
 * The key identifying one of React95's bundled themes.
 */
export type ThemeKey = keyof typeof themes

/**
 * A group of themes shown together under one heading in the theme picker.
 */
export type ThemeGroup = {
    label: string
    keys: ThemeKey[]
}

/**
 * The theme applied when the preferred one is missing or no longer shipped by
 * React95.
 */
export const FALLBACK_THEME_KEY: ThemeKey = "original"

/**
 * Every React95 theme, grouped so the ones that hold up at GitGame's density
 * come first and the novelty ones stay out of the way without being hidden.
 */
export const THEME_GROUPS: ThemeGroup[] = [
    {
        label: "Classic",
        keys: [
            "original",
            "millenium",
            "windows1",
            "ash",
            "coldGray",
            "slate",
            "stormClouds",
            "rainyDay",
            "olive",
            "maple",
            "brick",
            "marine",
            "water",
            "denim",
            "blue",
            "spruce",
            "white",
            "blackAndWhite",
            "highContrast",
        ],
    },
    {
        label: "Dark",
        keys: [
            "modernDark",
            "tokyoDark",
            "violetDark",
            "lilacRoseDark",
            "solarizedDark",
            "darkTeal",
            "eggplant",
            "redWine",
            "plum",
            "vistaesqueMidnight",
            "matrix",
            "counterStrike",
            "molecule",
            "wmii",
            "toner",
        ],
    },
    {
        label: "Colorful",
        keys: [
            "azureOrange",
            "candy",
            "cherry",
            "honey",
            "bee",
            "lilac",
            "rose",
            "raspberry",
            "vermillion",
            "seawater",
            "shelbiTeal",
            "vaporTeal",
            "polarized",
            "solarizedLight",
            "peggysPastels",
            "travel",
            "fxDev",
            "powerShell",
            "hotChocolate",
            "ninjaTurtles",
            "theSixtiesUSA",
        ],
    },
    {
        label: "Novelty",
        keys: ["hotdogStand", "aiee", "tooSexy", "pamelaAnderson"],
    },
]

/**
 * Resolves a stored theme key to the theme itself, falling back to the default
 * when the key is unknown.
 * @param key The stored theme key.
 * @returns The matching React95 theme.
 */
export function resolveTheme(key: string): Theme {
    return themes[key as ThemeKey] ?? themes[FALLBACK_THEME_KEY]
}
