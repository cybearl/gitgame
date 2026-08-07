import { Buffer } from "node:buffer"
import CONSTANTS from "@scripts/lib/constants"
import { encodePng } from "@scripts/lib/utils/png"
import type { RasterImage } from "@scripts/types/icons"

/**
 * Encodes an image as an ICO device independent bitmap, a bottom-up BGRA buffer trailed
 * by the 1-bit transparency mask the format still requires.
 * @param image The image to encode.
 * @returns The bitmap bytes.
 */
function encodeBitmap(image: RasterImage): Buffer {
    const stride = image.width * CONSTANTS.PNG_BYTES_PER_PIXEL
    const maskStride = Math.ceil(image.width / 32) * 4
    const colors = Buffer.alloc(image.height * stride)
    const mask = Buffer.alloc(image.height * maskStride)

    for (let y = 0; y < image.height; y++) {
        const flipped = image.height - 1 - y

        for (let x = 0; x < image.width; x++) {
            const source = (y * image.width + x) * CONSTANTS.PNG_BYTES_PER_PIXEL
            const target = flipped * stride + x * CONSTANTS.PNG_BYTES_PER_PIXEL

            colors[target] = image.pixels[source + 2]
            colors[target + 1] = image.pixels[source + 1]
            colors[target + 2] = image.pixels[source]
            colors[target + 3] = image.pixels[source + 3]

            if (!image.pixels[source + 3]) mask[flipped * maskStride + (x >> 3)] |= 0x80 >> (x & 7)
        }
    }

    const header = Buffer.alloc(CONSTANTS.ICO_BITMAP_HEADER_SIZE)
    header.writeUInt32LE(CONSTANTS.ICO_BITMAP_HEADER_SIZE, 0)
    header.writeInt32LE(image.width, 4)
    header.writeInt32LE(image.height * 2, 8)
    header.writeUInt16LE(1, 12)
    header.writeUInt16LE(32, 14)
    header.writeUInt32LE(colors.length + mask.length, 20)

    return Buffer.concat([header, colors, mask])
}

/**
 * Packs images into a Windows `.ico`, storing the largest entries as PNG and everything
 * below the threshold as a bitmap.
 * @param images The images to pack, in ascending size order.
 * @returns The ICO bytes.
 */
export function encodeIco(images: RasterImage[]): Buffer {
    const entries = images.map(image =>
        image.width >= CONSTANTS.ICO_PNG_THRESHOLD ? encodePng(image) : encodeBitmap(image),
    )

    const directory = Buffer.alloc(CONSTANTS.ICO_DIRECTORY_SIZE + entries.length * CONSTANTS.ICO_DIRECTORY_ENTRY_SIZE)
    directory.writeUInt16LE(1, 2)
    directory.writeUInt16LE(entries.length, 4)

    let offset = directory.length

    entries.forEach((entry, index) => {
        const position = CONSTANTS.ICO_DIRECTORY_SIZE + index * CONSTANTS.ICO_DIRECTORY_ENTRY_SIZE

        // A 256 pixel side is written as a zero, which is the widest the single byte can say
        directory[position] = images[index].width % 256
        directory[position + 1] = images[index].height % 256

        directory.writeUInt16LE(1, position + 4)
        directory.writeUInt16LE(32, position + 6)
        directory.writeUInt32LE(entry.length, position + 8)
        directory.writeUInt32LE(offset, position + 12)
        offset += entry.length
    })

    return Buffer.concat([directory, ...entries])
}
