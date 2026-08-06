/**
 * Sums the width the frames of a status bar ask for, every frame carries the
 * same minimum width, which the caption keeps even while it is stacked, so the
 * total stays the same whichever way the bar is currently laid out.
 * @param bar The status bar element.
 * @returns The width the bar needs to seat all of its frames on a single row.
 */
export function computeStatusBarRowWidth(bar: HTMLElement): number {
    const frames = [...bar.children] as HTMLElement[]

    const gap = Number.parseFloat(getComputedStyle(bar).columnGap) || 0
    const framesWidth = frames.reduce(
        (total, frame) => total + (Number.parseFloat(getComputedStyle(frame).minWidth) || 0),
        0,
    )

    return framesWidth + gap * Math.max(0, frames.length - 1)
}
