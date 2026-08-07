/**
 * A decoded raster image, its dimensions paired with a flat 8-bit RGBA pixel buffer.
 */
export type RasterImage = {
    width: number
    height: number
    pixels: Buffer
}

/**
 * The two pieces of source art every packaging icon is rendered from, the hand-drawn
 * 16x16 variant and the 32x32 one every other size is scaled from.
 */
export type IconSources = {
    small: RasterImage
    large: RasterImage
}

/**
 * A single macOS `.icns` entry, pairing the OSType naming the slot with the image
 * filling it.
 */
export type IcnsSlot = {
    type: string
    image: RasterImage
}
