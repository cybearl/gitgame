import { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import { readUAssetNameTable } from "@main/lib/uassets/parser/nameTable"
import { readUAssetExportMap, readUAssetImportMap } from "@main/lib/uassets/parser/objectResource"
import { readUAssetPackageFileSummary } from "@main/lib/uassets/parser/packageFileSummary"
import type { UAssetPackage } from "@/main/types/uassets"

/**
 * Parse a raw `.uasset` file buffer into its decoded Layer 1 parts: package summary, name
 * table, import map, and export map.
 *
 * Note: This is the top-level entry point for reading a `.uasset`, per-export tagged property
 * streams are not decoded here since their location inside an export depends on the export's
 * class; Layer 2 shapers handle that.
 * @param source Raw `.uasset` bytes as an `ArrayBuffer` or a view over one.
 * @returns The fully decoded package.
 * @throws When the file is not a valid `.uasset`, uses a summary format outside the reader's
 * supported range, is stored with legacy compressed chunks, or was saved unversioned.
 */
export function parseUAsset(source: ArrayBuffer | ArrayBufferView): UAssetPackage {
    const reader = new UAssetBufferReader(source)

    const summary = readUAssetPackageFileSummary(reader)
    const names = readUAssetNameTable(reader, summary)
    const imports = readUAssetImportMap(reader, summary, names)
    const exports = readUAssetExportMap(reader, summary, names)

    return {
        summary,
        names,
        imports,
        exports,
    }
}
