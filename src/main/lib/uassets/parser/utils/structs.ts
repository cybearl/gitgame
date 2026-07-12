import type { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import type { UAssetEngineVersion } from "@/main/types/uassets"

/**
 * Read a 20-byte `FIoHash` and return it as an upper-case hex string.
 * @param reader Buffer reader positioned at the start of the hash.
 * @returns The 40-character upper-case hex hash.
 * @see /Engine/Source/Runtime/Core/Public/IO/IoHash.h
 */
export function readIoHashHex(reader: UAssetBufferReader): string {
    const bytes = reader.bytes(20)
    let hex = ""
    for (const byte of bytes) hex += byte.toString(16).padStart(2, "0")
    return hex.toUpperCase()
}

/**
 * Read an `FEngineVersion` in the on-disk order (Major, Minor, Patch, Changelist, Branch).
 * @param reader Buffer reader positioned at the start of the version block.
 * @returns The decoded engine version.
 * @see /Engine/Source/Runtime/Core/Private/Misc/EngineVersion.cpp `operator<<(FStructuredArchive::FSlot, FEngineVersion&)`
 */
export function readEngineVersion(reader: UAssetBufferReader): UAssetEngineVersion {
    return {
        major: reader.uint16(),
        minor: reader.uint16(),
        patch: reader.uint16(),
        changelist: reader.uint32(),
        branch: reader.fstring(),
    }
}
