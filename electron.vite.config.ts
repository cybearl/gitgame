import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "electron-vite"

/**
 * Path alias mirroring the `@/*` entry from `tsconfig.json`, resolved to the
 * `src/` directory so code can import siblings via `@/config/window`.
 */
const srcRoot = path.resolve(__dirname, "src")

export default defineConfig({
    main: {
        resolve: {
            alias: { "@": srcRoot },
        },
    },
    preload: {
        resolve: {
            alias: { "@": srcRoot },
        },
    },
    renderer: {
        root: path.resolve(__dirname, "src", "renderer"),
        resolve: {
            alias: { "@": srcRoot },
        },
        plugins: [react()],
        build: {
            rollupOptions: {
                input: path.resolve(__dirname, "src", "renderer", "index.html"),
            },
        },
    },
})
