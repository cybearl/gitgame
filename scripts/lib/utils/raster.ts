import { Buffer } from "node:buffer"
import CONSTANTS from "@scripts/lib/constants"
import type { RasterImage } from "@scripts/types/icons"

/**
 * Blows an image up by an integer factor, duplicating pixels so the art keeps its hard
 * edges instead of being smoothed into a blur.
 * @param image The image to enlarge.
 * @param factor The integer factor to enlarge it by.
 * @returns The enlarged image.
 */
function scaleNearest(image: RasterImage, factor: number): RasterImage {
    const width = image.width * factor
    const height = image.height * factor
    const pixels = Buffer.alloc(width * height * CONSTANTS.PNG_BYTES_PER_PIXEL)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const source =
                (Math.floor(y / factor) * image.width + Math.floor(x / factor)) * CONSTANTS.PNG_BYTES_PER_PIXEL

            image.pixels.copy(
                pixels,
                (y * width + x) * CONSTANTS.PNG_BYTES_PER_PIXEL,
                source,
                source + CONSTANTS.PNG_BYTES_PER_PIXEL,
            )
        }
    }

    return { width, height, pixels }
}

/**
 * Shrinks an image by an integer factor, averaging each source block over premultiplied
 * alpha so transparent pixels never bleed their color into the edges.
 * @param image The image to shrink.
 * @param factor The integer factor to shrink it by.
 * @returns The shrunk image.
 */
function downsampleBox(image: RasterImage, factor: number): RasterImage {
    const width = image.width / factor
    const height = image.height / factor
    const pixels = Buffer.alloc(width * height * CONSTANTS.PNG_BYTES_PER_PIXEL)
    const samples = factor * factor

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let red = 0
            let green = 0
            let blue = 0
            let alpha = 0

            for (let dy = 0; dy < factor; dy++) {
                for (let dx = 0; dx < factor; dx++) {
                    const source = ((y * factor + dy) * image.width + x * factor + dx) * CONSTANTS.PNG_BYTES_PER_PIXEL
                    const weight = image.pixels[source + 3]

                    red += image.pixels[source] * weight
                    green += image.pixels[source + 1] * weight
                    blue += image.pixels[source + 2] * weight
                    alpha += weight
                }
            }

            const target = (y * width + x) * CONSTANTS.PNG_BYTES_PER_PIXEL
            pixels[target] = alpha ? Math.round(red / alpha) : 0
            pixels[target + 1] = alpha ? Math.round(green / alpha) : 0
            pixels[target + 2] = alpha ? Math.round(blue / alpha) : 0
            pixels[target + 3] = Math.round(alpha / samples)
        }
    }

    return { width, height, pixels }
}

/**
 * Resizes an image to a square target size, going through the smallest whole multiple
 * of the source the target divides into, so sizes that are an exact multiple stay pixel
 * perfect and the rest only soften on their half pixel boundaries.
 * @param image The image to resize.
 * @param size The square size to resize to, in pixels.
 * @returns The resized image.
 */
export function resizeIcon(image: RasterImage, size: number): RasterImage {
    let multiplier = 1
    while ((image.width * multiplier) % size !== 0) multiplier++

    const enlarged = multiplier > 1 ? scaleNearest(image, multiplier) : image
    const factor = enlarged.width / size

    return factor > 1 ? downsampleBox(enlarged, factor) : enlarged
}
