import "styled-components"
import type { Theme } from "react95/dist/common/themes/types"

/**
 * Augments styled-components' `DefaultTheme` with react95's theme shape so that
 * `theme` is fully typed inside styled component template literals.
 */
declare module "styled-components" {
    export interface DefaultTheme extends Theme {}
}
