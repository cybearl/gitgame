import nitpicker from "@alien_intelligence/eslint-plugin-nitpicker"
import tsParser from "@typescript-eslint/parser"

/**
 * ESLint flat config, it exists only to host Nitpicker for nit-level enforcement,
 * Biome still owns formatting and the broader lint rules.
 */
export default [
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: { nitpicker },
        rules: nitpicker.configs.recommended.rules,
    },
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        ...nitpicker.configs.breathing,
    },
    {
        files: ["src/renderer/**/*.tsx", "src/renderer/**/*.ts"],
        ...nitpicker.configs.react,
    },
    {
        files: ["src/renderer/**/*.tsx"],
        ignores: ["src/renderer/components/ui/**"],
        ...nitpicker.configs.design,
        rules: {
            ...nitpicker.configs.design.rules,
            // The react95 "Button" is beveled window chrome, a flat list row or theme
            // option is a "<button>" for the semantics alone and must not carry it
            "nitpicker/no-raw-control-element": [
                "warn",
                { allowIn: ["**/rows/FlatResults.tsx", "**/preferences/AppearanceTab.tsx"] },
            ],
        },
    },
]
