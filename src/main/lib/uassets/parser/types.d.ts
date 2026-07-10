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
 *   at the correct offset) but may be exposed as-is here for downstream inspection.
 * - Offsets serialized as `int64` are surfaced as `bigint`, the rest are
 *   `int32`. Sections that don't exist in the file typically use `count = 0`
 *   and `offset = -1`.
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
