import fs from "node:fs"
import path from "node:path"
import CONSTANTS from "@scripts/lib/constants"
import { encodeIcns } from "@scripts/lib/utils/icns"
import { encodeIco } from "@scripts/lib/utils/ico"
import { decodePng, encodePng } from "@scripts/lib/utils/png"
import { resizeIcon } from "@scripts/lib/utils/raster"
import type { IconSources, RasterImage } from "@scripts/types/icons"

/**
 * Reads the source art off disk.
 * @returns The decoded source images.
 */
function readSources(): IconSources {
    const { dir, smallFile, largeFile } = CONSTANTS.ICON_SOURCE

    return {
        small: decodePng(fs.readFileSync(path.join(dir, smallFile))),
        large: decodePng(fs.readFileSync(path.join(dir, largeFile))),
    }
}

/**
 * Renders the app art at a given size, taking the hand-drawn 16x16 variant where it
 * applies and scaling the 32x32 one everywhere else.
 * @param sources The decoded source images.
 * @param size The square size to render at, in pixels.
 * @returns The rendered image.
 */
function renderIcon(sources: IconSources, size: number): RasterImage {
    return size === sources.small.width ? sources.small : resizeIcon(sources.large, size)
}

/**
 * Renders every icon the packaging and the main process need.
 * @param sources The decoded source images.
 * @returns Each output file paired with the bytes to write to it.
 */
function renderOutputs(sources: IconSources): [string, Buffer][] {
    const icnsSlots = Object.entries(CONSTANTS.ICNS_SLOT_SIZES).map(([type, size]) => ({
        type,
        image: renderIcon(sources, size),
    }))

    return [
        [
            path.join(CONSTANTS.ICON_OUTPUT.packagingDir, "icon.png"),
            encodePng(renderIcon(sources, CONSTANTS.ICON_MASTER_SIZE)),
        ],
        [
            path.join(CONSTANTS.ICON_OUTPUT.packagingDir, "icon.ico"),
            encodeIco(CONSTANTS.ICO_SIZES.map(size => renderIcon(sources, size))),
        ],
        [path.join(CONSTANTS.ICON_OUTPUT.packagingDir, "icon.icns"), encodeIcns(icnsSlots)],
        [CONSTANTS.ICON_OUTPUT.runtimeFile, encodePng(renderIcon(sources, CONSTANTS.ICON_RUNTIME_SIZE))],
        ...CONSTANTS.LINUX_ICON_SIZES.map((size): [string, Buffer] => [
            path.join(CONSTANTS.ICON_OUTPUT.linuxDir, `${size}x${size}.png`),
            encodePng(renderIcon(sources, size)),
        ]),
    ]
}

/**
 * Regenerates every packaging icon from the React95 source art.
 */
function generateIcons() {
    const outputs = renderOutputs(readSources())

    for (const [file, contents] of outputs) {
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, contents)

        console.log(`${path.relative(process.cwd(), file).replace(/\\/g, "/")} (${contents.length} bytes)`)
    }
}

generateIcons()
