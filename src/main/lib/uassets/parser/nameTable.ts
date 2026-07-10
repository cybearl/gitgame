import type { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import { UAssetObjectVersionUE4 as UE4 } from "@main/lib/uassets/enums/objectVersionUE4"
import type { UAssetPackageFileSummary } from "@main/lib/uassets/parser/types"

/**
 * Read the entire name table into an array of strings, indexed by FName index.
 *
 * Imports, exports, property tags, and every other in-package identifier reference names by
 * their zero-based index into this table, so it must be loaded before any of them.
 *
 * @param reader Buffer reader; will be seeked to `summary.nameOffset`.
 * @param summary Package summary providing `nameOffset`, `nameCount`, and the UE4 version
 *     used to gate the trailing hash bytes.
 * @returns Array of length `summary.nameCount` where index `i` is the `i`-th FName string.
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/LinkerLoad.cpp `SerializeNameMap`
 * @see /Engine/Source/Runtime/Core/Private/UObject/UnrealNames.cpp `operator<<(FArchive&, FNameEntrySerialized&)`
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

/**
 * Read a single `FNameEntrySerialized` from the reader's current position.
 *
 * The wire format is an `FString` (length prefix + string bytes + null terminator) followed
 * by two `uint16` hashes for post-`VER_UE4_NAME_HASHES_SERIALIZED` files. UE writes both hashes
 * out of habit but ignores them on load, so we skip past them without decoding.
 *
 * @param reader Buffer reader positioned at the start of the entry.
 * @param hasHashes True when the entry ends with `NonCasePreservingHash` + `CasePreservingHash`.
 * @returns The decoded name string.
 */
function readNameEntry(reader: UAssetBufferReader, hasHashes: boolean): string {
    const name = reader.fstring()

    if (hasHashes) {
        // NonCasePreservingHash + CasePreservingHash, both uint16, unused at load time
        reader.uint16()
        reader.uint16()
    }

    return name
}
