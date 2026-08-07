import { Buffer } from "node:buffer"
import zlib from "node:zlib"
import CONSTANTS from "@scripts/lib/constants"
import type { RasterImage } from "@scripts/types/icons"

/**
 * Computes the CRC-32 checksum PNG appends to each of its chunks.
 * @param buffer The bytes to checksum.
 * @returns The unsigned CRC-32 value.
 */
function crc32(buffer: Buffer): number {
    let crc = 0xffffffff
    for (const byte of buffer) crc = CONSTANTS.PNG_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)

    return (crc ^ 0xffffffff) >>> 0
}

/**
 * Picks the reference byte for PNG's Paeth filter, the neighbor the predicted value
 * lands closest to.
 * @param left The byte one pixel to the left.
 * @param above The byte one row up.
 * @param upperLeft The byte one pixel left on the row above.
 * @returns The chosen neighbor.
 */
function paethPredictor(left: number, above: number, upperLeft: number): number {
    const estimate = left + above - upperLeft
    const toLeft = Math.abs(estimate - left)
    const toAbove = Math.abs(estimate - above)
    const toUpperLeft = Math.abs(estimate - upperLeft)

    if (toLeft <= toAbove && toLeft <= toUpperLeft) return left
    return toAbove <= toUpperLeft ? above : upperLeft
}

/**
 * Wraps chunk data in the length, type and CRC framing PNG expects.
 * @param type The four character chunk type.
 * @param data The chunk payload.
 * @returns The framed chunk.
 */
function buildChunk(type: string, data: Buffer): Buffer {
    const chunk = Buffer.alloc(12 + data.length)
    chunk.writeUInt32BE(data.length, 0)
    chunk.write(type, 4, "ascii")
    data.copy(chunk, 8)
    chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length)

    return chunk
}

/**
 * Decodes an 8-bit non-interlaced RGBA PNG into a flat pixel buffer.
 * @param file The raw PNG bytes.
 * @returns The decoded image.
 */
export function decodePng(file: Buffer): RasterImage {
    const blocks: Buffer[] = []
    let width = 0
    let height = 0
    let offset = CONSTANTS.PNG_SIGNATURE.length

    while (offset < file.length) {
        const length = file.readUInt32BE(offset)
        const type = file.toString("ascii", offset + 4, offset + 8)
        const data = file.subarray(offset + 8, offset + 8 + length)

        if (type === "IHDR") {
            width = data.readUInt32BE(0)
            height = data.readUInt32BE(4)

            if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) {
                throw new Error("only 8-bit non-interlaced RGBA PNG sources are supported")
            }
        } else if (type === "IDAT") blocks.push(data)

        offset += 12 + length
    }

    const raw = zlib.inflateSync(Buffer.concat(blocks))
    const stride = width * CONSTANTS.PNG_BYTES_PER_PIXEL
    const pixels = Buffer.alloc(height * stride)

    for (let row = 0; row < height; row++) {
        const filter = raw[row * (stride + 1)]

        for (let index = 0; index < stride; index++) {
            const hasLeft = index >= CONSTANTS.PNG_BYTES_PER_PIXEL
            const left = hasLeft ? pixels[row * stride + index - CONSTANTS.PNG_BYTES_PER_PIXEL] : 0
            const above = row > 0 ? pixels[(row - 1) * stride + index] : 0
            const upperLeft =
                row > 0 && hasLeft ? pixels[(row - 1) * stride + index - CONSTANTS.PNG_BYTES_PER_PIXEL] : 0

            let value = raw[row * (stride + 1) + 1 + index]
            if (filter === 1) value += left
            else if (filter === 2) value += above
            else if (filter === 3) value += (left + above) >> 1
            else if (filter === 4) value += paethPredictor(left, above, upperLeft)

            pixels[row * stride + index] = value & 0xff
        }
    }

    return { width, height, pixels }
}

/**
 * Encodes an image as an 8-bit RGBA PNG, leaving every scan-line unfiltered since flat
 * pixel art deflates well enough on its own.
 * @param image The image to encode.
 * @returns The PNG bytes.
 */
export function encodePng(image: RasterImage): Buffer {
    const stride = image.width * CONSTANTS.PNG_BYTES_PER_PIXEL
    const raw = Buffer.alloc(image.height * (stride + 1))

    for (let row = 0; row < image.height; row++) {
        image.pixels.copy(raw, row * (stride + 1) + 1, row * stride, (row + 1) * stride)
    }

    const header = Buffer.alloc(13)
    header.writeUInt32BE(image.width, 0)
    header.writeUInt32BE(image.height, 4)
    header[8] = 8
    header[9] = 6

    return Buffer.concat([
        CONSTANTS.PNG_SIGNATURE,
        buildChunk("IHDR", header),
        buildChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
        buildChunk("IEND", Buffer.alloc(0)),
    ])
}
