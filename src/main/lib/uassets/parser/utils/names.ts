import type { UAssetBufferReader } from "@main/lib/uassets/bufferReader"

/**
 * Read a single `FNameEntrySerialized` from the reader's current position, the wire format
 * is an `FString` (length prefix + string bytes + null terminator) followed by two `uint16`
 * hashes for post-`VER_UE4_NAME_HASHES_SERIALIZED` files, UE writes both hashes out of habit
 * but ignores them on load so we skip past them without decoding.
 * @param reader Buffer reader positioned at the start of the entry.
 * @param hasHashes True when the entry ends with `NonCasePreservingHash` + `CasePreservingHash`.
 * @returns The decoded name string.
 * @see /Engine/Source/Runtime/Core/Private/UObject/UnrealNames.cpp `operator<<(FArchive&, FNameEntrySerialized&)`
 */
export function readNameEntry(reader: UAssetBufferReader, hasHashes: boolean): string {
    const name = reader.fstring()

    if (hasHashes) {
        // NonCasePreservingHash + CasePreservingHash, both uint16, unused at load time
        reader.uint16()
        reader.uint16()
    }

    return name
}

/**
 * Read an on-disk `FName` reference (int32 name index + int32 numeric suffix) and resolve it
 * against the given name table, UE stores the suffix as `ExternalNumber + 1` so `0` means
 * "no suffix", `1` means `_0`, `2` means `_1`, and so on.
 * @param reader Buffer reader positioned at the start of the FName pair.
 * @param names Name table produced by `readUAssetNameTable`.
 * @returns The base name string with `_N` suffix appended when the on-disk number is positive.
 * @throws When the name index is out of range for `names`, which indicates a corrupt file.
 */
export function readFName(reader: UAssetBufferReader, names: string[]): string {
    const nameIndex = reader.int32()
    const number = reader.int32()

    if (nameIndex < 0 || nameIndex >= names.length) {
        throw new Error(`Invalid FName index ${nameIndex} (name table has ${names.length} entries).`)
    }

    const base = names[nameIndex]
    return number > 0 ? `${base}_${number - 1}` : base
}
