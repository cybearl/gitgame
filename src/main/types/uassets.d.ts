/**
 * Numeric value + engine's inline doc comment for a single enum entry.
 * */
export type UAssetEnumEntry = {
    value: number
    comment: string
}

/**
 * One entry from the summary's custom version container: subsystem GUID + version index.
 */
export interface UAssetCustomVersion {
    /**
     * 32-char upper-hex GUID identifying the subsystem (Blueprints, Framework, Niagara, ...).
     */
    key: string

    /**
     * Subsystem-specific version index the package was saved with.
     */
    version: number
}

/**
 * Decoded `FEngineVersion` (semantic version + branch string).
 */
export interface UAssetEngineVersion {
    /**
     * Major version number, e.g. `5` for UE 5.x.
     */
    major: number

    /**
     * Minor version number, e.g. `8` for UE 5.8.
     */
    minor: number

    /**
     * Patch/hotfix version number.
     */
    patch: number

    /**
     * Perforce/git changelist number the engine was built at.
     */
    changelist: number

    /**
     * Release branch name, e.g. `++UE5+Release-5.8`.
     */
    branch: string
}

/**
 * One entry in the summary's generation list: counts snapshot at a prior save.
 */
export interface UAssetGenerationInfo {
    /**
     * Number of exports the package had at this generation.
     */
    exportCount: number

    /**
     * Number of names the package had at this generation.
     */
    nameCount: number
}

/**
 * Decoded `FPackageFileSummary`.
 *
 * Notes:
 * - Fields not useful to Layer 1 extraction are still advanced past (so the reader lands
 * at the correct offset) but may be exposed as-is here for downstream inspection.
 * - Offsets serialized as `int64` are surfaced as `bigint`, the rest are
 * `int32`. Sections that don't exist in the file typically use `count = 0`
 * and `offset = -1`.
 * @see /Engine/Source/Runtime/CoreUObject/Public/UObject/PackageFileSummary.h
 */
export interface UAssetPackageFileSummary {
    /**
     * Magic number identifying the file as a UE package. Matches `PACKAGE_FILE_TAG` after
     * any endian swap has been applied by the reader.
     */
    tag: number

    /**
     * Summary format revision. Always negative for modern packages, `-9` at the time of writing.
     */
    legacyFileVersion: number

    /**
     * Vestigial UE3 engine version field. Kept in the wire format for backward compat, unused today.
     */
    legacyUE3Version: number

    /**
     * UE4 object format version the package was saved with. Compare against `UAssetObjectVersionUE4`.
     */
    fileVersionUE4: number

    /**
     * UE5 object format version (0 for packages saved before UE5). Compare against `UAssetObjectVersionUE5`.
     */
    fileVersionUE5: number

    /**
     * Custom licensee-specific format version. Typically 0 for stock Epic builds.
     */
    fileVersionLicenseeUE: number

    /**
     * Per-subsystem version table (Blueprint, Niagara, Framework, ...) the package was saved against.
     */
    customVersions: UAssetCustomVersion[]

    /**
     * Hex-encoded `FIoHash` (post-`PACKAGE_SAVED_HASH`) or legacy `FGuid` identifying the saved bytes.
     */
    savedHash: string

    /**
     * Total on-disk size of the summary plus name table plus import & export maps combined.
     */
    totalHeaderSize: number

    /**
     * Original package path at last save, e.g. `/Game/Characters/BP_Enemy`.
     */
    packageName: string

    /**
     * `EPackageFlags` bitmask. Test against entries in `UAssetPackageFlags`.
     */
    packageFlags: number

    /**
     * Number of entries in the name table.
     */
    nameCount: number

    /**
     * Byte offset from the start of the file to the name table.
     */
    nameOffset: number

    /**
     * Number of soft object path entries (present when `ADD_SOFTOBJECTPATH_LIST` or newer).
     */
    softObjectPathsCount: number

    /**
     * Byte offset to the soft object path list, `-1` when the section is absent.
     */
    softObjectPathsOffset: number

    /**
     * Editor-only localization identifier for this package.
     */
    localizationId: string

    /**
     * Number of gatherable localizable text fragments in this package.
     */
    gatherableTextDataCount: number

    /**
     * Byte offset to the gatherable text data section, `-1` when absent.
     */
    gatherableTextDataOffset: number

    /**
     * Number of objects defined inside this package.
     */
    exportCount: number

    /**
     * Byte offset to the export map (list of `FObjectExport` entries).
     */
    exportOffset: number

    /**
     * Number of external objects this package references.
     */
    importCount: number

    /**
     * Byte offset to the import map (list of `FObjectImport` entries).
     */
    importOffset: number

    /**
     * Number of Verse cell exports (present when `VERSE_CELLS` or newer).
     */
    cellExportCount: number

    /**
     * Byte offset to the cell export map, `-1` when absent.
     */
    cellExportOffset: number

    /**
     * Number of Verse cell imports.
     */
    cellImportCount: number

    /**
     * Byte offset to the cell import map, `-1` when absent.
     */
    cellImportOffset: number

    /**
     * Byte offset to the metadata section (present when `METADATA_SERIALIZATION_OFFSET` or newer).
     */
    metaDataOffset: number

    /**
     * Byte offset to the export dependency table (per-export import indices).
     */
    dependsOffset: number

    /**
     * Number of soft package references stored in this package.
     */
    softPackageReferencesCount: number

    /**
     * Byte offset to the soft package references section, `-1` when absent.
     */
    softPackageReferencesOffset: number

    /**
     * Byte offset to the searchable names map, `-1` when absent.
     */
    searchableNamesOffset: number

    /**
     * Byte offset to the editor thumbnail table, `-1` in cooked packages.
     */
    thumbnailTableOffset: number

    /**
     * Number of import type hierarchy entries (present when `IMPORT_TYPE_HIERARCHIES` or newer).
     */
    importTypeHierarchiesCount: number

    /**
     * Byte offset to the import type hierarchy map, `-1` when absent.
     */
    importTypeHierarchiesOffset: number

    /**
     * Editor-only stable identity for this package, empty when the file was saved without editor data.
     */
    persistentGuid: string

    /**
     * Snapshot counts for each prior save of this package, latest last.
     */
    generations: UAssetGenerationInfo[]

    /**
     * Engine build that wrote this file to disk.
     */
    savedByEngineVersion: UAssetEngineVersion

    /**
     * Oldest engine build that can still load this file (matters for hotfix releases).
     */
    compatibleWithEngineVersion: UAssetEngineVersion

    /**
     * Legacy package-level compression flags. Should be `0` for source (editor-side) `.uasset` files.
     */
    compressionFlags: number

    /**
     * Value UE uses to distinguish official saves from modder-built packages.
     */
    packageSource: number

    /**
     * Byte offset to the asset registry tag data (thumbnails, class info for the editor browser).
     */
    assetRegistryDataOffset: number

    /**
     * Byte offset where bulk data (mip levels, sound waves, geometry buffers) begins. `int64`.
     */
    bulkDataStartOffset: bigint

    /**
     * Byte offset to `FWorldTileInfo`, `-1` for non-map assets.
     */
    worldTileInfoDataOffset: number

    /**
     * Streaming-install chunk IDs this package is assigned to.
     */
    chunkIds: number[]

    /**
     * Number of preload dependency graph entries (cooked-only, `-1` on editor-side files).
     */
    preloadDependencyCount: number

    /**
     * Byte offset to the preload dependency graph.
     */
    preloadDependencyOffset: number

    /**
     * Number of leading name entries actually referenced by serialized export data
     * (present when `NAMES_REFERENCED_FROM_EXPORT_DATA` or newer, defaults to `nameCount`).
     */
    namesReferencedFromExportDataCount: number

    /**
     * Byte offset to the payload table of contents (present when `PAYLOAD_TOC` or newer), `-1` when absent. `int64`.
     */
    payloadTocOffset: bigint

    /**
     * Byte offset to the bulk/data resource table (present when `DATA_RESOURCES` or newer), `-1` when absent.
     */
    dataResourceOffset: number
}

/**
 * Decoded `FObjectImport`, one entry in the import map. Represents an external object this
 * package references. FName fields are pre-resolved to their display strings using the name
 * table, `FPackageIndex` fields (outerIndex) are kept as raw signed integers: `0` means null,
 * positive `N` points at export `N - 1`, negative `-N` points at import `N - 1`.
 * @see /Engine/Source/Runtime/CoreUObject/Public/UObject/ObjectResource.h `FObjectImport`
 */
export interface UAssetImport {
    /**
     * Class's outer package, e.g. `"/Script/CoreUObject"` or `"/Script/Engine"`.
     */
    classPackage: string

    /**
     * Class type of the imported object, e.g. `"Class"`, `"Function"`, `"BlueprintGeneratedClass"`, `"Texture2D"`.
     */
    className: string

    /**
     * `FPackageIndex` of this import's outer (containing) object, or `0` for a top-level import.
     */
    outerIndex: number

    /**
     * Name of the imported object itself, e.g. `"BP_Enemy_C"` or `"T_Rock_Diffuse"`.
     */
    objectName: string

    /**
     * Containing package path of this import (post-`VER_UE4_NON_OUTER_PACKAGE_IMPORT`). Empty
     * string on older packages that inferred the package from the outer chain instead.
     */
    packageName: string

    /**
     * True when this import is optional and may not be present at load time
     * (post-`OPTIONAL_RESOURCES`).
     */
    bImportOptional: boolean
}

/**
 * Decoded `FObjectExport`, one entry in the export map. Represents an object defined inside
 * this package. FName fields are pre-resolved to strings; `FPackageIndex` fields are raw
 * signed integers with the same convention as `UAssetImport.outerIndex`.
 * @see /Engine/Source/Runtime/CoreUObject/Public/UObject/ObjectResource.h `FObjectExport`
 */
export interface UAssetExport {
    /**
     * Package index of the object's class (typically a negative value pointing at an import).
     */
    classIndex: number

    /**
     * Package index of the object's parent (super) class, or `0` when none.
     */
    superIndex: number

    /**
     * Package index of the object's archetype template, `0` when pre-`VER_UE4_TemplateIndex_IN_COOKED_EXPORTS`.
     */
    templateIndex: number

    /**
     * Package index of the object's outer (containing) object, `0` when this is a top-level export.
     */
    outerIndex: number

    /**
     * Name of the exported object itself.
     */
    objectName: string

    /**
     * `EObjectFlags` bitmask (masked to `RF_Load` on save).
     */
    objectFlags: number

    /**
     * Serialized byte size of this export's property data. `int64` on modern packages, `int32` pre-`VER_UE4_64BIT_EXPORTMAP_SERIALSIZES`.
     */
    serialSize: bigint

    /**
     * Byte offset to this export's serialized property data, absolute from file start.
     */
    serialOffset: bigint

    /**
     * True if this export was force-included by the cooker.
     */
    bForcedExport: boolean

    /**
     * True if this export is stripped in client-only builds.
     */
    bNotForClient: boolean

    /**
     * True if this export is stripped in server-only builds.
     */
    bNotForServer: boolean

    /**
     * True when the export was inherited from a parent generation (post-`TRACK_OBJECT_EXPORT_IS_INHERITED`).
     */
    bIsInheritedInstance: boolean

    /**
     * `EPackageFlags` bitmask associated with this specific export (usually mirrors summary flags).
     */
    packageFlags: number

    /**
     * True when the export should not always be loaded for editor games (post-`VER_UE4_LOAD_FOR_EDITOR_GAME`).
     */
    bNotAlwaysLoadedForEditorGame: boolean

    /**
     * True when this export represents a top-level asset (post-`VER_UE4_COOKED_ASSETS_IN_EDITOR_SUPPORT`).
     */
    bIsAsset: boolean

    /**
     * True when a public hash should be generated for this export (post-`OPTIONAL_RESOURCES`).
     */
    bGeneratePublicHash: boolean

    /**
     * Starting index into the preload dependency array (post-`VER_UE4_PRELOAD_DEPENDENCIES_IN_COOKED_EXPORTS`).
     */
    firstExportDependency: number

    /**
     * Number of "serialize before serialize" preload dependencies.
     */
    serializationBeforeSerializationDependencies: number

    /**
     * Number of "create before serialize" preload dependencies.
     */
    createBeforeSerializationDependencies: number

    /**
     * Number of "serialize before create" preload dependencies.
     */
    serializationBeforeCreateDependencies: number

    /**
     * Number of "create before create" preload dependencies.
     */
    createBeforeCreateDependencies: number

    /**
     * Start of the script serialization block (post-`SCRIPT_SERIALIZATION_OFFSET`, absent when using unversioned property serialization).
     */
    scriptSerializationStartOffset: bigint

    /**
     * End of the script serialization block.
     */
    scriptSerializationEndOffset: bigint
}

/**
 * Header data for one tagged property inside an export's property stream. The value payload
 * itself is not decoded here, use `valueOffset` + `size` to locate the raw bytes when a
 * downstream module needs them (a type-specific extractor, a diff tool, etc.).
 * @see /Engine/Source/Runtime/CoreUObject/Private/UObject/PropertyTag.cpp `operator<<(FStructuredArchive::FSlot, FPropertyTag&)`
 */
export interface UAssetPropertyTag {
    /**
     * Property name, e.g. `"Damage"` or `"MeshComponent"`.
     */
    name: string

    /**
     * Rendered property type. Simple types read as the class name (`"IntProperty"`,
     * `"NameProperty"`), containers include their inner type (`"StructProperty(Vector)"`,
     * `"ArrayProperty(StructProperty(Vector))"`, `"MapProperty(NameProperty,ObjectProperty)"`).
     */
    typeName: string

    /**
     * Serialized byte size of the value payload that follows the header. `0` for skipped tags
     * and `BoolProperty` tags whose value is baked into the flag bits.
     */
    size: number

    /**
     * Position within a static array. `0` for scalar (non-array) properties.
     */
    arrayIndex: number

    /**
     * True when the tag represents a `BoolProperty` set to `true`. False encodes both `false`
     * booleans and non-boolean tags.
     */
    boolValue: boolean

    /**
     * True when the tag was marked as skipped during save; the value payload is empty.
     */
    skipped: boolean

    /**
     * True when the value payload uses the property's binary/native `Serialize` method instead
     * of the property system's default serialization.
     */
    binaryOrNativeSerialize: boolean

    /**
     * Optional per-property GUID (used by properties that migrate their name across engine
     * versions). Empty string when not present.
     */
    propertyGuid: string

    /**
     * Byte offset (absolute from file start) to the start of the value payload.
     */
    valueOffset: bigint
}

/**
 * Full Layer 1 decode of a `.uasset` file: header summary, resolved name table, import map,
 * and export map. Tagged property streams are not decoded here since their location inside
 * each export depends on the export's class (Layer 2 concern).
 */
export interface UAssetPackage {
    /**
     * Decoded `FPackageFileSummary` at the top of the file.
     */
    summary: UAssetPackageFileSummary

    /**
     * Name table indexed by FName index.
     */
    names: string[]

    /**
     * External object references (`FObjectImport` entries) with FNames pre-resolved.
     */
    imports: UAssetImport[]

    /**
     * Objects defined inside this package (`FObjectExport` entries) with FNames pre-resolved.
     */
    exports: UAssetExport[]
}
