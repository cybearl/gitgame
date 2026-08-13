import usePreferences from "@renderer/hooks/usePreferences"
import { type ReactNode, useMemo } from "react"
import { createScrollbars } from "react95"
import { createGlobalStyle, StyleSheetManager, ThemeProvider } from "styled-components"
import { resolveTheme } from "@/renderer/config/themes"
import { shouldForwardStyledProp } from "@/renderer/lib/utils/styled"
import { buildSizerGripUrl, buildThemeVariables } from "@/renderer/lib/utils/theme"

/**
 * Mirrors the active theme onto the CSS custom properties the Tailwind
 * utilities read.
 */
const GlobalStyles = createGlobalStyle`
    :root {
        ${({ theme }) => buildThemeVariables(theme)}
    }

    body {
        background-color: ${({ theme }) => theme.material};
    }

    ${createScrollbars()}

    .tree-scrollview > div::-webkit-scrollbar-corner {
        background-image: ${({ theme }) => buildSizerGripUrl(theme)};
        background-position: bottom right;
        background-size: 16px 16px;
        background-repeat: no-repeat;
    }
`

type AppRootProps = {
    children: ReactNode
    themeKey?: string
}

export default function AppRoot({ children, themeKey }: AppRootProps) {
    const { preferences } = usePreferences()

    /**
     * The theme this window paints with.
     */
    const theme = useMemo(() => resolveTheme(themeKey ?? preferences.theme), [themeKey, preferences.theme])

    return (
        <StyleSheetManager shouldForwardProp={shouldForwardStyledProp}>
            <ThemeProvider theme={theme}>
                <GlobalStyles />

                {children}
            </ThemeProvider>
        </StyleSheetManager>
    )
}
