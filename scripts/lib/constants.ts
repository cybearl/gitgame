import { Buffer } from "node:buffer"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * The project root, resolved from this file's own location.
 */
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

/**
 * The constants for the build scripts.
 */
const CONSTANTS = {
    /**
     * Where the app art is taken from, the React95 set ships a hand-drawn 16x16 variant
     * next to the 32x32 one every other size is scaled from.
     */
    ICON_SOURCE: {
        dir: path.join(ROOT_DIR, "node_modules", "@react95", "icons", "png"),
        smallFile: "Computer3_16x16_4.png",
        largeFile: "Computer3_32x32_4.png",
    },

    /**
     * Where the generated icons land.
     */
    ICON_OUTPUT: {
        packagingDir: path.join(ROOT_DIR, "resources"),
        linuxDir: path.join(ROOT_DIR, "resources", "icons"),
        runtimeFile: path.join(ROOT_DIR, "src", "main", "assets", "icon.png"),
    },

    /**
     * The size of the master PNG, which is what electron-builder falls back to for any
     * platform left without a dedicated icon file.
     */
    ICON_MASTER_SIZE: 1024,

    /**
     * The size of the icon the main process hands to its windows.
     */
    ICON_RUNTIME_SIZE: 256,

    /**
     * The sizes packed into the Windows `.ico`.
     */
    ICO_SIZES: [16, 24, 32, 48, 64, 128, 256],

    /**
     * The sizes emitted as loose PNGs for Linux.
     */
    LINUX_ICON_SIZES: [16, 24, 32, 48, 64, 128, 256, 512],

    /**
     * The macOS `.icns` slots, each pairing an OSType with the size it holds, covering
     * every 1x and 2x variant `iconutil` would emit.
     */
    ICNS_SLOT_SIZES: {
        icp4: 16,
        icp5: 32,
        ic11: 32,
        ic12: 64,
        ic07: 128,
        ic13: 256,
        ic08: 256,
        ic09: 512,
        ic14: 512,
        ic10: 1024,
    },

    /**
     * The eight byte signature every PNG file opens with.
     */
    PNG_SIGNATURE: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),

    /**
     * The number of bytes a pixel takes in the 8-bit RGBA buffers used throughout.
     */
    PNG_BYTES_PER_PIXEL: 4,

    /**
     * The CRC-32 lookup table guarding PNG chunks.
     */
    PNG_CRC_TABLE: new Uint32Array(256).map((_, index) => {
        let value = index
        for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
        return value
    }),

    /**
     * The size of the `BITMAPINFOHEADER` opening every bitmap backed `.ico` entry.
     */
    ICO_BITMAP_HEADER_SIZE: 40,

    /**
     * The size of the `ICONDIR` opening an `.ico`, followed by one `ICONDIRENTRY` of
     * `ICO_DIRECTORY_ENTRY_SIZE` bytes per packed image.
     */
    ICO_DIRECTORY_SIZE: 6,
    ICO_DIRECTORY_ENTRY_SIZE: 16,

    /**
     * The smallest entry stored as a PNG rather than as a bitmap, which is how the
     * format has carried its largest sizes since Vista.
     */
    ICO_PNG_THRESHOLD: 256,
} as const

export default CONSTANTS
