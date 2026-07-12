import { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import { readUAssetPropertyTags } from "@main/lib/uassets/parser/propertyTag"
import { describe, test } from "vitest"
import type { UAssetPackageFileSummary } from "@/main/types/uassets"

/**
 * Bare-minimum `UAssetPackageFileSummary` shape used by `readUAssetPropertyTags`, the reader
 * only touches `packageFlags` (unversioned check) and `fileVersionUE5` (format gate), so we
 * cast a partial object rather than filling every field.
 */
const SUMMARY = {
    packageFlags: 0,
    fileVersionUE5: 1012, // PROPERTY_TAG_COMPLETE_TYPE_NAME
} as unknown as UAssetPackageFileSummary

/**
 * Synthetic name table used across the buffers constructed below. Index 0 is `"None"` so the
 * reader's stream terminator is a simple zero-filled FName pair.
 */
const NAMES = ["None", "MyIntProp", "IntProperty", "MyBoolProp", "BoolProperty"]

describe("readUAssetPropertyTags: synthetic streams", () => {
    test("reads one IntProperty tag and stops at the None terminator", ({ expect }) => {
        const buffer = Buffer.from([
            // "name": FName(index=1 -> "MyIntProp", number=0)
            0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // "typeName": 1 node, FName(index=2 -> "IntProperty", number=0), innerCount=0
            0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // "size": int32(4)
            0x04, 0x00, 0x00, 0x00,
            // "flags": uint8(0), no optional fields
            0x00,
            // "value": int32(42)
            0x2a, 0x00, 0x00, 0x00,
            // Stream terminator: FName(index=0 -> "None", number=0)
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ])
        const reader = new UAssetBufferReader(buffer)

        const tags = readUAssetPropertyTags(reader, SUMMARY, NAMES, 0)

        expect(tags).toHaveLength(1)
        expect(tags[0].name).toBe("MyIntProp")
        expect(tags[0].typeName).toBe("IntProperty")
        expect(tags[0].size).toBe(4)
        expect(tags[0].arrayIndex).toBe(0)
        expect(tags[0].boolValue).toBe(false)
        expect(tags[0].skipped).toBe(false)
        expect(tags[0].binaryOrNativeSerialize).toBe(false)
        expect(tags[0].propertyGuid).toBe("")
    })

    test("BoolTrue flag surfaces via boolValue with a zero-size payload", ({ expect }) => {
        const buffer = Buffer.from([
            // "name": FName(index=3 -> "MyBoolProp", number=0)
            0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // "typeName": 1 node, FName(index=4 -> "BoolProperty", number=0), innerCount=0
            0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // "size": int32(0), value lives in the flag bits
            0x00, 0x00, 0x00, 0x00,
            // "flags": uint8(0x10 = BoolTrue)
            0x10,
            // Stream terminator: FName(index=0 -> "None", number=0)
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ])
        const reader = new UAssetBufferReader(buffer)

        const tags = readUAssetPropertyTags(reader, SUMMARY, NAMES, 0)

        expect(tags).toHaveLength(1)
        expect(tags[0].name).toBe("MyBoolProp")
        expect(tags[0].typeName).toBe("BoolProperty")
        expect(tags[0].size).toBe(0)
        expect(tags[0].boolValue).toBe(true)
    })

    test("empty stream (immediate None terminator) returns no tags", ({ expect }) => {
        // Stream terminator only: FName(index=0 -> "None", number=0)
        const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
        const reader = new UAssetBufferReader(buffer)

        const tags = readUAssetPropertyTags(reader, SUMMARY, NAMES, 0)

        expect(tags).toHaveLength(0)
    })

    test("throws on unversioned property serialization", ({ expect }) => {
        const unversioned = {
            packageFlags: 0x2000, // PKG_UnversionedProperties
            fileVersionUE5: 1012,
        } as unknown as UAssetPackageFileSummary
        const reader = new UAssetBufferReader(Buffer.alloc(8))

        expect(() => readUAssetPropertyTags(reader, unversioned, NAMES, 0)).toThrow(/unversioned/)
    })

    test("throws on legacy pre-PROPERTY_TAG_COMPLETE_TYPE_NAME files", ({ expect }) => {
        const legacy = {
            packageFlags: 0,
            fileVersionUE5: 1011,
        } as unknown as UAssetPackageFileSummary
        const reader = new UAssetBufferReader(Buffer.alloc(8))

        expect(() => readUAssetPropertyTags(reader, legacy, NAMES, 0)).toThrow(/legacy/i)
    })
})
