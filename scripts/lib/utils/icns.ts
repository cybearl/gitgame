import { Buffer } from "node:buffer"
import { encodePng } from "@scripts/lib/utils/png"
import type { IcnsSlot } from "@scripts/types/icons"

/**
 * Packs slots into a macOS `.icns`, one PNG backed chunk each.
 * @param slots The slots to pack.
 * @returns The ICNS bytes.
 */
export function encodeIcns(slots: IcnsSlot[]): Buffer {
    const chunks = slots.map(({ type, image }) => {
        const data = encodePng(image)
        const chunk = Buffer.alloc(8 + data.length)
        chunk.write(type, 0, "ascii")
        chunk.writeUInt32BE(chunk.length, 4)
        data.copy(chunk, 8)

        return chunk
    })

    const header = Buffer.alloc(8)
    header.write("icns", 0, "ascii")
    header.writeUInt32BE(header.length + chunks.reduce((total, chunk) => total + chunk.length, 0), 4)

    return Buffer.concat([header, ...chunks])
}
