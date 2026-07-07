import type { ReactNode } from "react"
import { createScrollbars } from "react95"
import originalTheme from "react95/dist/themes/original"
import { createGlobalStyle, ThemeProvider } from "styled-components"

/**
 * Applies react95's Win95 scrollbar styling globally.
 */
const GlobalScrollbars = createGlobalStyle`
    ${createScrollbars()}
`

type AppRootProps = {
    children: ReactNode
}

export default function AppRoot({ children }: AppRootProps) {
    return (
        <ThemeProvider theme={originalTheme}>
            <GlobalScrollbars />

            {children}
        </ThemeProvider>
    )
}
