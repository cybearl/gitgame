import type { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import { UAssetObjectVersionUE5 as UE5 } from "@main/lib/uassets/enums/objectVersionUE5"
import { UAssetPackageFlags } from "@main/lib/uassets/enums/packageFlags"
import { readFName } from "@main/lib/uassets/parser/utils/names"
import type { UAssetPackageFileSummary, UAssetPropertyTag } from "@/main/types/uassets"

/**
 * Bit values of `EPropertyTagFlags`, the `uint8` bitmask written between `Size` and the
 * conditional extra fields on every tag header.
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/PropertyTag.cpp `enum class EPropertyTagFlags`
 */
enum PropertyTagFlag {
    HasArrayIndex = 0x01,
    HasPropertyGuid = 0x02,
    HasPropertyExtensions = 0x04,
    HasBinaryOrNativeSerialize = 0x08,
    BoolTrue = 0x10,
    SkippedSerialize = 0x20,
}

/**
 * Bit values of `EPropertyTagExtension`, the `uint8` bitmask written at the start of the
 * extensions block when `HasPropertyExtensions` is set.
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/PropertyTag.cpp `enum class EPropertyTagExtension`
 */
enum PropertyTagExtension {
    OverridableInformation = 0x02,
    HasExternalsObjects = 0x04,
}

/**
 * Advance past the optional property-extensions block written when `HasPropertyExtensions` is
 * set. The two currently defined extension groups (`OverridableInformation`,
 * `HasExternalsObjects`) are consumed but their values are discarded.
 * @param reader Buffer reader positioned at the start of the extensions block.
 */
function skipPropertyExtensions(reader: UAssetBufferReader): void {
    const extensions = reader.uint8()

    if ((extensions & PropertyTagExtension.OverridableInformation) !== 0) {
        reader.uint8() // OverriddenPropertyOperation
        reader.bool32() // ExperimentalOverridableLogic
    }

    if ((extensions & PropertyTagExtension.HasExternalsObjects) !== 0) {
        reader.bool32() // ExperimentalExternalObjects
    }
}

/**
 * Recursively render a `FPropertyTypeName` subtree into `Name(child1,child2,...)` form.
 * @param nodes Full node array from `readPropertyTypeName`.
 * @param index Starting index of the subtree to render.
 * @returns The subtree's rendered text and the index of the next sibling node.
 */
function renderTypeName(nodes: { name: string; innerCount: number }[], index: number): { text: string; next: number } {
    const node = nodes[index]
    if (node.innerCount === 0) {
        return {
            text: node.name,
            next: index + 1,
        }
    }

    const parts: string[] = []
    let next = index + 1
    for (let i = 0; i < node.innerCount; i++) {
        const child = renderTypeName(nodes, next)
        parts.push(child.text)
        next = child.next
    }

    return {
        text: `${node.name}(${parts.join(",")})`,
        next,
    }
}

/**
 * Read an `FPropertyTypeName` (a pre-order-encoded tree of `{FName, int32 innerCount}` nodes)
 * and render it as a human-readable dotted string, e.g. `"StructProperty(Vector)"`.
 * @param reader Buffer reader positioned at the start of the type name tree.
 * @param names Name table used to resolve node FName references.
 * @returns The rendered type name string.
 */
function readPropertyTypeName(reader: UAssetBufferReader, names: string[]): string {
    const nodes: { name: string; innerCount: number }[] = []

    let remaining = 1
    do {
        const name = readFName(reader, names)
        const innerCount = reader.int32()
        nodes.push({ name, innerCount })
        remaining += innerCount - 1
    } while (remaining > 0)

    return renderTypeName(nodes, 0).text
}

/**
 * Read a single tag header from the reader's current position, or return `null` when the
 * stream terminator (a None-named tag) is encountered.
 * @param reader Buffer reader positioned at the start of the tag.
 * @param names Name table used to resolve embedded FName references.
 * @returns The decoded tag header, or `null` at end-of-stream.
 */
function readTagHeader(reader: UAssetBufferReader, names: string[]): UAssetPropertyTag | null {
    const name = readFName(reader, names)
    if (name === "None") return null

    const typeName = readPropertyTypeName(reader, names)
    const size = reader.int32()
    const flags = reader.uint8()

    const arrayIndex = (flags & PropertyTagFlag.HasArrayIndex) === 0 ? 0 : reader.int32()
    const propertyGuid = (flags & PropertyTagFlag.HasPropertyGuid) === 0 ? "" : reader.fguid()

    if ((flags & PropertyTagFlag.HasPropertyExtensions) !== 0) {
        skipPropertyExtensions(reader)
    }

    const valueOffset = BigInt(reader.tell())

    return {
        name,
        typeName,
        size,
        arrayIndex,
        boolValue: (flags & PropertyTagFlag.BoolTrue) !== 0,
        skipped: (flags & PropertyTagFlag.SkippedSerialize) !== 0,
        binaryOrNativeSerialize: (flags & PropertyTagFlag.HasBinaryOrNativeSerialize) !== 0,
        propertyGuid,
        valueOffset,
    }
}

/**
 * Read the property tag stream starting at `startOffset` and stop when the None terminator
 * is reached. Value payloads are skipped over (not decoded); each returned tag carries the
 * absolute `valueOffset` and byte `size` so callers can locate the raw payload later.
 *
 * Note: Only the modern tag format (post-`PROPERTY_TAG_COMPLETE_TYPE_NAME`, i.e. UE 5.4+) is
 * supported. The pre-1012 legacy format inline type-specific header fields per property class
 * and is deferred to a future extension.
 * @param reader Buffer reader; will be seeked to `startOffset`.
 * @param summary Package summary; provides version gates and the unversioned-properties flag.
 * @param names Fully resolved name table from `readUAssetNameTable`.
 * @param startOffset Byte offset of the tag stream, typically `export.serialOffset`.
 * @returns Array of decoded tag headers in stream order (terminator excluded).
 * @throws When the package uses unversioned property serialization (no tags emitted) or when
 * the file predates `PROPERTY_TAG_COMPLETE_TYPE_NAME` (legacy format not supported).
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/PropertyTag.cpp `operator<<(FStructuredArchive::FSlot, FPropertyTag&)`
 */
export function readUAssetPropertyTags(
    reader: UAssetBufferReader,
    summary: UAssetPackageFileSummary,
    names: string[],
    startOffset: number,
): UAssetPropertyTag[] {
    if ((summary.packageFlags & UAssetPackageFlags.PKG_UnversionedProperties.value) !== 0) {
        throw new Error("Cannot read tagged properties: package uses unversioned property serialization.")
    }
    if (summary.fileVersionUE5 < UE5.PROPERTY_TAG_COMPLETE_TYPE_NAME.value) {
        throw new Error(
            `Legacy property tag format (pre-PROPERTY_TAG_COMPLETE_TYPE_NAME, UE5 version ${summary.fileVersionUE5}) is not supported by this reader.`,
        )
    }

    reader.seek(startOffset)

    const tags: UAssetPropertyTag[] = []
    while (true) {
        const tag = readTagHeader(reader, names)
        if (tag === null) break

        tags.push(tag)
        reader.skip(tag.size)
    }

    return tags
}
