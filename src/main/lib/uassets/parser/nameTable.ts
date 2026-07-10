import type { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import { UAssetObjectVersionUE4 as UE4 } from "@main/lib/uassets/enums/objectVersionUE4"
import { readNameEntry } from "@main/lib/uassets/parser/utils/names"
import type { UAssetPackageFileSummary } from "@/main/types/uassets"

/**
 * Read the entire name table into an array of strings, indexed by FName index.
 *
 * Note: Imports, exports, property tags, and every other in-package identifier reference names by
 * their zero-based index into this table, so it must be loaded before any of them.
 * @param reader Buffer reader; will be seeked to `summary.nameOffset`.
 * @param summary Package summary providing `nameOffset`, `nameCount`, and the UE4 version
 * used to gate the trailing hash bytes.
 * @returns Array of length `summary.nameCount` where index `i` is the `i`-th FName string.
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/LinkerLoad.cpp `SerializeNameMap`
 */
export function readUAssetNameTable(reader: UAssetBufferReader, summary: UAssetPackageFileSummary): string[] {
    reader.seek(summary.nameOffset)

    const hasHashes = summary.fileVersionUE4 >= UE4.VER_UE4_NAME_HASHES_SERIALIZED.value
    const names: string[] = new Array(summary.nameCount)

    for (let i = 0; i < summary.nameCount; i++) {
        names[i] = readNameEntry(reader, hasHashes)
    }

    return names
}
