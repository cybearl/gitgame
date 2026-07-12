import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

/**
 * The main configuration for the Vitest tests.
 */
const vitestConfig = defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        include: ["./tests/unit/**/*.test.ts"],
    },
})

export default vitestConfig
