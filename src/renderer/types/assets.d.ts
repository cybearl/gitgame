/**
 * Ambient declaration for static PNG asset imports resolved by Vite at build time.
 */
declare module "*.png" {
    const src: string
    export default src
}

/**
 * Ambient declaration for static WOFF2 asset imports resolved by Vite at build time.
 */
declare module "*.woff2" {
    const src: string
    export default src
}

/**
 * Ambient declaration for direct PNG imports through the `@react95-icons/*` alias (for React95).
 */
declare module "@react95-icons/*" {
    const src: string
    export default src
}
