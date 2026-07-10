import type { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import { UAssetObjectVersionUE4 as UE4 } from "@main/lib/uassets/enums/objectVersionUE4"
import { UAssetObjectVersionUE5 as UE5 } from "@main/lib/uassets/enums/objectVersionUE5"
import { UAssetPackageFlags } from "@main/lib/uassets/enums/packageFlags"
import { readFName } from "@main/lib/uassets/parser/utils/names"
import type { UAssetExport, UAssetImport, UAssetPackageFileSummary } from "@/main/types/uassets"

/**
 * Read a single `FObjectImport` from the reader's current position.
 * @param reader Buffer reader positioned at the start of the entry.
 * @param summary Package summary; supplies the file versions used to gate optional fields.
 * @param names Name table used to resolve embedded FName references.
 * @returns The decoded import entry.
 */
function readImport(reader: UAssetBufferReader, summary: UAssetPackageFileSummary, names: string[]): UAssetImport {
    const classPackage = readFName(reader, names)
    const className = readFName(reader, names)
    const outerIndex = reader.int32()
    const objectName = readFName(reader, names)

    let packageName = ""
    if (summary.fileVersionUE4 >= UE4.VER_UE4_NON_OUTER_PACKAGE_IMPORT.value) {
        packageName = readFName(reader, names)
    }

    let bImportOptional = false
    if (summary.fileVersionUE5 >= UE5.OPTIONAL_RESOURCES.value) {
        bImportOptional = reader.bool32()
    }

    return {
        classPackage,
        className,
        outerIndex,
        objectName,
        packageName,
        bImportOptional,
    }
}

/**
 * Read every entry in the import map into an array of resolved imports.
 *
 * Notes:
 * - FName fields inside each import are pre-resolved against `names`, the returned strings are
 * ready to feed into commit-message context without further lookup.
 * - `FPackageIndex` fields (only `outerIndex` on imports) stay as raw signed integers.
 * @param reader Buffer reader; will be seeked to `summary.importOffset`.
 * @param summary Package summary providing `importOffset`, `importCount`, and gating versions.
 * @param names Fully resolved name table from `readUAssetNameTable`.
 * @returns Array of length `summary.importCount`.
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/ObjectResource.cpp `operator<<(FStructuredArchive::FSlot, FObjectImport&)`
 */
export function readUAssetImportMap(
    reader: UAssetBufferReader,
    summary: UAssetPackageFileSummary,
    names: string[],
): UAssetImport[] {
    reader.seek(summary.importOffset)

    const imports: UAssetImport[] = new Array(summary.importCount)
    for (let i = 0; i < summary.importCount; i++) {
        imports[i] = readImport(reader, summary, names)
    }

    return imports
}

/**
 * Read a single `FObjectExport` from the reader's current position.
 * @param reader Buffer reader positioned at the start of the entry.
 * @param summary Package summary; supplies file versions and the unversioned-properties flag.
 * @param names Name table used to resolve embedded FName references.
 * @returns The decoded export entry.
 */
function readExport(reader: UAssetBufferReader, summary: UAssetPackageFileSummary, names: string[]): UAssetExport {
    const classIndex = reader.int32()
    const superIndex = reader.int32()

    let templateIndex = 0
    if (summary.fileVersionUE4 >= UE4.VER_UE4_TEMPLATEINDEX_IN_COOKED_EXPORTS.value) {
        templateIndex = reader.int32()
    }

    const outerIndex = reader.int32()
    const objectName = readFName(reader, names)
    const objectFlags = reader.uint32()

    // SerialSize/SerialOffset widened from int32 to int64 in VER_UE4_64BIT_EXPORTMAP_SERIALSIZES (511)
    let serialSize: bigint
    let serialOffset: bigint
    if (summary.fileVersionUE4 >= UE4.VER_UE4_64BIT_EXPORTMAP_SERIALSIZES.value) {
        serialSize = reader.int64()
        serialOffset = reader.int64()
    } else {
        serialSize = BigInt(reader.int32())
        serialOffset = BigInt(reader.int32())
    }

    const bForcedExport = reader.bool32()
    const bNotForClient = reader.bool32()
    const bNotForServer = reader.bool32()

    // Pre-REMOVE_OBJECT_EXPORT_PACKAGE_GUID (1005) files carry a 16-byte dummy FGuid here
    if (summary.fileVersionUE5 < UE5.REMOVE_OBJECT_EXPORT_PACKAGE_GUID.value) {
        reader.skip(16)
    }

    let bIsInheritedInstance = false
    if (summary.fileVersionUE5 >= UE5.TRACK_OBJECT_EXPORT_IS_INHERITED.value) {
        bIsInheritedInstance = reader.bool32()
    }

    const packageFlags = reader.uint32()

    let bNotAlwaysLoadedForEditorGame = false
    if (summary.fileVersionUE4 >= UE4.VER_UE4_LOAD_FOR_EDITOR_GAME.value) {
        bNotAlwaysLoadedForEditorGame = reader.bool32()
    }

    let bIsAsset = false
    if (summary.fileVersionUE4 >= UE4.VER_UE4_COOKED_ASSETS_IN_EDITOR_SUPPORT.value) {
        bIsAsset = reader.bool32()
    }

    let bGeneratePublicHash = false
    if (summary.fileVersionUE5 >= UE5.OPTIONAL_RESOURCES.value) {
        bGeneratePublicHash = reader.bool32()
    }

    let firstExportDependency = -1
    let serializationBeforeSerializationDependencies = 0
    let createBeforeSerializationDependencies = 0
    let serializationBeforeCreateDependencies = 0
    let createBeforeCreateDependencies = 0
    if (summary.fileVersionUE4 >= UE4.VER_UE4_PRELOAD_DEPENDENCIES_IN_COOKED_EXPORTS.value) {
        firstExportDependency = reader.int32()
        serializationBeforeSerializationDependencies = reader.int32()
        createBeforeSerializationDependencies = reader.int32()
        serializationBeforeCreateDependencies = reader.int32()
        createBeforeCreateDependencies = reader.int32()
    }

    // ScriptSerializationStartOffset/EndOffset only present when the package uses versioned
    // property serialization and is at least SCRIPT_SERIALIZATION_OFFSET (1010)
    const usesUnversionedProps = (summary.packageFlags & UAssetPackageFlags.PKG_UnversionedProperties.value) !== 0
    let scriptSerializationStartOffset = 0n
    let scriptSerializationEndOffset = 0n
    if (!usesUnversionedProps && summary.fileVersionUE5 >= UE5.SCRIPT_SERIALIZATION_OFFSET.value) {
        scriptSerializationStartOffset = reader.int64()
        scriptSerializationEndOffset = reader.int64()
    }

    return {
        classIndex,
        superIndex,
        templateIndex,
        outerIndex,
        objectName,
        objectFlags,
        serialSize,
        serialOffset,
        bForcedExport,
        bNotForClient,
        bNotForServer,
        bIsInheritedInstance,
        packageFlags,
        bNotAlwaysLoadedForEditorGame,
        bIsAsset,
        bGeneratePublicHash,
        firstExportDependency,
        serializationBeforeSerializationDependencies,
        createBeforeSerializationDependencies,
        serializationBeforeCreateDependencies,
        createBeforeCreateDependencies,
        scriptSerializationStartOffset,
        scriptSerializationEndOffset,
    }
}

/**
 * Read every entry in the export map into an array of resolved exports.
 *
 * Note: `objectName` is pre-resolved, all `FPackageIndex` fields (`classIndex`, `superIndex`,
 * `templateIndex`, `outerIndex`) stay as raw signed integers using UE's convention: `0` is
 * null, positive `N` points at export `N - 1`, negative `-N` points at import `N - 1`.
 * @param reader Buffer reader; will be seeked to `summary.exportOffset`.
 * @param summary Package summary providing `exportOffset`, `exportCount`, and gating versions.
 * @param names Fully resolved name table from `readUAssetNameTable`.
 * @returns Array of length `summary.exportCount`.
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/ObjectResource.cpp `operator<<(FStructuredArchive::FSlot, FObjectExport&)`
 */
export function readUAssetExportMap(
    reader: UAssetBufferReader,
    summary: UAssetPackageFileSummary,
    names: string[],
): UAssetExport[] {
    reader.seek(summary.exportOffset)

    const exports: UAssetExport[] = new Array(summary.exportCount)

    for (let i = 0; i < summary.exportCount; i++) {
        exports[i] = readExport(reader, summary, names)
    }

    return exports
}
