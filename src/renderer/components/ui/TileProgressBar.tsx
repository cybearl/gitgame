import { cn } from "@cybearl/cypack/frontend"
import { ProgressBar } from "react95"
import styled, { css } from "styled-components"

/**
 * Recolors the tiles to `theme.borderDark` when muted, so
 * the inactive bar shows as light shadow-grey.
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
    isMuted?: boolean
    hideValue?: boolean
    className?: string
}

export default function TileProgressBar({
    value,
    isMuted = false,
    hideValue = false,
    className,
}: TileProgressBarProps) {
    return (
        <Wrapper $muted={isMuted}>
            <ProgressBar
                variant="tile"
                value={value}
                hideValue={hideValue}
                className={cn("w-full! shrink-0 h-8!", isMuted && "opacity-60", className)}
            />
        </Wrapper>
    )
}
