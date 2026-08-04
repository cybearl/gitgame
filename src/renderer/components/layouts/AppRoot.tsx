import type { ReactNode } from "react"
import { createScrollbars } from "react95"
import originalTheme from "react95/dist/themes/original"
import { createGlobalStyle, StyleSheetManager, ThemeProvider } from "styled-components"
import { shouldForwardStyledProp } from "@/renderer/lib/utils/styled"

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
        <StyleSheetManager shouldForwardProp={shouldForwardStyledProp}>
            <ThemeProvider theme={originalTheme}>
                <GlobalScrollbars />

                {children}
            </ThemeProvider>
        </StyleSheetManager>
    )
}
