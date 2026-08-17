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
        rules: {
            ...nitpicker.configs.recommended.rules,
            // TODO: re-enable once the upstream `e.charAt is not a function` crash is fixed,
            // it currently trips on any TS `import type` line and aborts the whole lint run.
            "nitpicker/no-british-english": "off",
        },
    },
    {
        files: ["src/renderer/**/*.tsx", "src/renderer/**/*.ts"],
        ...nitpicker.configs.react,
    },
]
