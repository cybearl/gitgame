import { cn } from "@cybearl/cypack/frontend"
import { ProgressBar } from "react95"
import styled, { css } from "styled-components"

/**
 * Recolors the tile ProgressBar's tiles to `theme.borderDark` when muted, so
 * the inactive bar shows as light shadow-grey instead of the near-black a
 * `grayscale` filter lands on when applied to the saturated `theme.progress`
 * blue.
 */
const Wrapper = styled.div<{ $muted: boolean }>`
    display: contents;

    ${({ $muted, theme }) =>
        $muted &&
        css`
            [data-testid="tileProgress"] > span {
                background: ${theme.borderDark};
            }
        `}
`

type TileProgressBarProps = {
    value: number
    muted?: boolean
    className?: string
}

/**
 * The react95 tile ProgressBar wrapped with a status-bar-friendly muted state,
 * used by the status chips to fade the bar to shadow-grey when the underlying
 * service is idle or errored.
 * @param props Tile bar props, `muted` toggles the grey recolor.
 * @returns The wrapped ProgressBar.
 */
export default function TileProgressBar({ value, muted = false, className }: TileProgressBarProps) {
    return (
        <Wrapper $muted={muted}>
            <ProgressBar
                variant="tile"
                value={value}
                hideValue
                className={cn("w-full! shrink-0 h-8!", muted && "opacity-60", className)}
            />
        </Wrapper>
    )
}
