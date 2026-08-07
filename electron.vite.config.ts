import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "electron-vite"

// Path aliases matching the TsConfig
const srcRoot = path.resolve(__dirname, "src")
const mainRoot = path.resolve(srcRoot, "main")
const preloadRoot = path.resolve(srcRoot, "preload")
const rendererRoot = path.resolve(srcRoot, "renderer")
const react95IconsRoot = path.resolve(__dirname, "node_modules", "@react95", "icons", "png")
const react95FontsRoot = path.resolve(__dirname, "node_modules", "react95", "dist", "fonts")

// Every bundle lands under a single output root
const outRoot = path.resolve(__dirname, "dist", "app")

/**
 * Path aliases for module resolution.
 */
const aliases = {
    "@": srcRoot,
    "@main": mainRoot,
    "@preload": preloadRoot,
    "@renderer": rendererRoot,
    "@react95-icons": react95IconsRoot,
    "@react95-fonts": react95FontsRoot,
}

export default defineConfig({
    main: {
        resolve: { alias: aliases },
        build: { outDir: path.join(outRoot, "main") },
    },
    preload: {
        resolve: { alias: aliases },
        build: { outDir: path.join(outRoot, "preload") },
    },
    renderer: {
        root: path.resolve(__dirname, "src", "renderer"),
        base: "./",
        resolve: { alias: aliases },
        plugins: [react(), tailwindcss()],
        build: {
            outDir: path.join(outRoot, "renderer"),
            rollupOptions: {
                input: path.resolve(__dirname, "src", "renderer", "index.html"),
            },
        },
    },
})
