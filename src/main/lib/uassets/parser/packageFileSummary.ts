import CONSTANTS from "@main/lib/constants"
import type { UAssetBufferReader } from "@main/lib/uassets/bufferReader"
import { UAssetObjectVersionUE4 as UE4 } from "@main/lib/uassets/enums/objectVersionUE4"
import { UAssetObjectVersionUE5 as UE5 } from "@main/lib/uassets/enums/objectVersionUE5"
import { UAssetPackageFileTag } from "@main/lib/uassets/enums/packageFileTag"
import { UAssetPackageFlags } from "@main/lib/uassets/enums/packageFlags"
import { readEngineVersion, readIoHashHex } from "@main/lib/uassets/parser/utils/structs"
import dedent from "dedent"
import type {
    UAssetCustomVersion,
    UAssetEngineVersion,
    UAssetGenerationInfo,
    UAssetPackageFileSummary,
} from "@/main/types/uassets"

/**
 * Zeroed `UAssetEngineVersion`, used as a default when the summary predates engine-version tracking.
 * @returns An all-zero engine version with empty branch string.
 */
function emptyEngineVersion(): UAssetEngineVersion {
    return {
        major: 0,
        minor: 0,
        patch: 0,
        changelist: 0,
        branch: "",
    }
}

/**
 * Read the `FPackageFileSummary` at the reader's current position.
 * @param reader Buffer reader positioned at the start of the file.
 * @returns The decoded summary.
 * @throws When the tag is invalid, the summary format is too old/new to parse, the file is
 * saved unversioned (not supported), or the package is stored with legacy compression.
 */
export function readUAssetPackageFileSummary(reader: UAssetBufferReader): UAssetPackageFileSummary {
    const tag = reader.uint32()

    if (tag === UAssetPackageFileTag.PACKAGE_FILE_TAG_SWAPPED) {
        reader.setLittleEndian(false)
    } else if (tag !== UAssetPackageFileTag.PACKAGE_FILE_TAG) {
        throw new Error(`Not a .uasset file: tag 0x${tag.toString(16)} does not match PACKAGE_FILE_TAG.`)
    }

    const legacyFileVersion = reader.int32()

    if (legacyFileVersion >= 0) {
        throw new Error(`Unsupported .uasset: legacy UE3-era file (LegacyFileVersion=${legacyFileVersion}).`)
    }

    if (legacyFileVersion < CONSTANTS.uasset.currentLegacyFileVersion) {
        throw new Error(
            dedent`Unsupported .uasset: LegacyFileVersion=${legacyFileVersion} is newer than this
            reader supports (max ${CONSTANTS.uasset.currentLegacyFileVersion}).`,
        )
    }

    // LegacyFileVersion == -4 is the one revision where LegacyUE3Version was dropped from the wire
    let legacyUE3Version = 0
    if (legacyFileVersion !== -4) {
        legacyUE3Version = reader.int32()
    }

    const fileVersionUE4 = reader.int32()
    const fileVersionUE5 = legacyFileVersion <= -8 ? reader.int32() : 0
    const fileVersionLicenseeUE = reader.int32()

    if (fileVersionUE4 === 0 && fileVersionUE5 === 0 && fileVersionLicenseeUE === 0) {
        throw new Error("Unsupported .uasset: unversioned packages are not supported by this reader.")
    }
    if (fileVersionUE4 < UE4.VER_UE4_OLDEST_LOADABLE_PACKAGE.value) {
        throw new Error(
            `Unsupported .uasset: FileVersionUE4=${fileVersionUE4} is older than the oldest loadable package.`,
        )
    }

    // Post-PACKAGE_SAVED_HASH the SavedHash + TotalHeaderSize block moves up before custom versions
    const hasEarlySavedHash = fileVersionUE5 >= UE5.PACKAGE_SAVED_HASH.value
    let savedHash = ""
    let totalHeaderSize = 0
    if (hasEarlySavedHash) {
        savedHash = readIoHashHex(reader)
        totalHeaderSize = reader.int32()
    }

    // LegacyFileVersion <= -2 always writes a custom version container
    // For our supported range (>= -9) the format is `Optimized`: int32 count followed by (FGuid Key, int32 Version) pairs
    const customVersions: UAssetCustomVersion[] = []
    const customVersionCount = reader.int32()
    for (let i = 0; i < customVersionCount; i++) {
        const key = reader.fguid()
        const version = reader.int32()
        customVersions.push({ key, version })
    }

    if (!hasEarlySavedHash) {
        totalHeaderSize = reader.int32()
    }

    const packageName = reader.fstring()
    const packageFlags = reader.uint32()
    const filterEditorOnly = (packageFlags & UAssetPackageFlags.PKG_FilterEditorOnly.value) !== 0

    const nameCount = reader.int32()
    const nameOffset = reader.int32()

    let softObjectPathsCount = 0
    let softObjectPathsOffset = -1
    if (fileVersionUE5 >= UE5.ADD_SOFTOBJECTPATH_LIST.value) {
        softObjectPathsCount = reader.int32()
        softObjectPathsOffset = reader.int32()
    }

    let localizationId = ""
    if (!filterEditorOnly && fileVersionUE4 >= UE4.VER_UE4_ADDED_PACKAGE_SUMMARY_LOCALIZATION_ID.value) {
        localizationId = reader.fstring()
    }

    let gatherableTextDataCount = 0
    let gatherableTextDataOffset = -1
    if (fileVersionUE4 >= UE4.VER_UE4_SERIALIZE_TEXT_IN_PACKAGES.value) {
        gatherableTextDataCount = reader.int32()
        gatherableTextDataOffset = reader.int32()
    }

    const exportCount = reader.int32()
    const exportOffset = reader.int32()
    const importCount = reader.int32()
    const importOffset = reader.int32()

    let cellExportCount = 0
    let cellExportOffset = -1
    let cellImportCount = 0
    let cellImportOffset = -1
    if (fileVersionUE5 >= UE5.VERSE_CELLS.value) {
        cellExportCount = reader.int32()
        cellExportOffset = reader.int32()
        cellImportCount = reader.int32()
        cellImportOffset = reader.int32()
    }

    let metaDataOffset = -1
    if (fileVersionUE5 >= UE5.METADATA_SERIALIZATION_OFFSET.value) {
        metaDataOffset = reader.int32()
    }

    const dependsOffset = reader.int32()

    let softPackageReferencesCount = 0
    let softPackageReferencesOffset = -1
    if (fileVersionUE4 >= UE4.VER_UE4_ADD_STRING_ASSET_REFERENCES_MAP.value) {
        softPackageReferencesCount = reader.int32()
        softPackageReferencesOffset = reader.int32()
    }

    let searchableNamesOffset = -1
    if (fileVersionUE4 >= UE4.VER_UE4_ADDED_SEARCHABLE_NAMES.value) {
        searchableNamesOffset = reader.int32()
    }

    const thumbnailTableOffset = reader.int32()

    let importTypeHierarchiesCount = 0
    let importTypeHierarchiesOffset = -1
    if (fileVersionUE5 >= UE5.IMPORT_TYPE_HIERARCHIES.value) {
        importTypeHierarchiesCount = reader.int32()
        importTypeHierarchiesOffset = reader.int32()
    }

    // Pre-PACKAGE_SAVED_HASH files stored a legacy FGuid here instead of the FIoHash above
    if (!hasEarlySavedHash) {
        savedHash = reader.fguid()
    }

    let persistentGuid = ""
    if (!filterEditorOnly && fileVersionUE4 >= UE4.VER_UE4_ADDED_PACKAGE_OWNER.value) {
        persistentGuid = reader.fguid()
        // OwnerPersistentGuid existed for one UE4 version between VER_UE4_ADDED_PACKAGE_OWNER (518) and VER_UE4_NON_OUTER_PACKAGE_IMPORT (520)
        // Read and discard when present
        if (fileVersionUE4 < UE4.VER_UE4_NON_OUTER_PACKAGE_IMPORT.value) {
            reader.fguid()
        }
    }

    const generationCount = reader.int32()
    const generations: UAssetGenerationInfo[] = []
    for (let i = 0; i < generationCount; i++) {
        generations.push({ exportCount: reader.int32(), nameCount: reader.int32() })
    }

    let savedByEngineVersion: UAssetEngineVersion = emptyEngineVersion()
    if (fileVersionUE4 >= UE4.VER_UE4_ENGINE_VERSION_OBJECT.value) {
        savedByEngineVersion = readEngineVersion(reader)
    } else {
        const engineChangelist = reader.int32()
        if (engineChangelist !== 0) {
            savedByEngineVersion = { major: 4, minor: 0, patch: 0, changelist: engineChangelist, branch: "" }
        }
    }

    let compatibleWithEngineVersion: UAssetEngineVersion = savedByEngineVersion
    if (fileVersionUE4 >= UE4.VER_UE4_PACKAGE_SUMMARY_HAS_COMPATIBLE_ENGINE_VERSION.value) {
        compatibleWithEngineVersion = readEngineVersion(reader)
    }

    const compressionFlags = reader.uint32()
    const compressedChunkCount = reader.int32()
    if (compressedChunkCount !== 0) {
        throw new Error(
            `Unsupported .uasset: package uses legacy compressed chunks (count=${compressedChunkCount}), only uncompressed source assets are readable.`,
        )
    }

    const packageSource = reader.uint32()

    // AdditionalPackagesToCook is unused since ages, but still serialized as TArray<FString>
    const additionalPackagesCount = reader.int32()
    for (let i = 0; i < additionalPackagesCount; i++) {
        reader.fstring()
    }

    // Legacy texture allocation info was removed in LegacyFileVersion -7
    // Our supported range never hits the read path since CONSTANTS.uasset.currentLegacyFileVersion is -9

    const assetRegistryDataOffset = reader.int32()
    const bulkDataStartOffset = reader.int64()

    let worldTileInfoDataOffset = -1
    if (fileVersionUE4 >= UE4.VER_UE4_WORLD_LEVEL_INFO.value) {
        worldTileInfoDataOffset = reader.int32()
    }

    const chunkIds: number[] = []
    if (fileVersionUE4 >= UE4.VER_UE4_CHANGED_CHUNKID_TO_BE_AN_ARRAY_OF_CHUNKIDS.value) {
        const chunkIdCount = reader.int32()
        for (let i = 0; i < chunkIdCount; i++) chunkIds.push(reader.int32())
    } else if (fileVersionUE4 >= UE4.VER_UE4_ADDED_CHUNKID_TO_ASSETDATA_AND_UPACKAGE.value) {
        const singleChunkId = reader.int32()
        if (singleChunkId >= 0) chunkIds.push(singleChunkId)
    }

    let preloadDependencyCount = -1
    let preloadDependencyOffset = 0
    if (fileVersionUE4 >= UE4.VER_UE4_PRELOAD_DEPENDENCIES_IN_COOKED_EXPORTS.value) {
        preloadDependencyCount = reader.int32()
        preloadDependencyOffset = reader.int32()
    }

    let namesReferencedFromExportDataCount = nameCount
    if (fileVersionUE5 >= UE5.NAMES_REFERENCED_FROM_EXPORT_DATA.value) {
        namesReferencedFromExportDataCount = reader.int32()
    }

    let payloadTocOffset = -1n
    if (fileVersionUE5 >= UE5.PAYLOAD_TOC.value) {
        payloadTocOffset = reader.int64()
    }

    let dataResourceOffset = -1
    if (fileVersionUE5 >= UE5.DATA_RESOURCES.value) {
        dataResourceOffset = reader.int32()
    }

    return {
        tag,
        legacyFileVersion,
        legacyUE3Version,
        fileVersionUE4,
        fileVersionUE5,
        fileVersionLicenseeUE,
        customVersions,
        savedHash,
        totalHeaderSize,
        packageName,
        packageFlags,
        nameCount,
        nameOffset,
        softObjectPathsCount,
        softObjectPathsOffset,
        localizationId,
        gatherableTextDataCount,
        gatherableTextDataOffset,
        exportCount,
        exportOffset,
        importCount,
        importOffset,
        cellExportCount,
        cellExportOffset,
        cellImportCount,
        cellImportOffset,
        metaDataOffset,
        dependsOffset,
        softPackageReferencesCount,
        softPackageReferencesOffset,
        searchableNamesOffset,
        thumbnailTableOffset,
        importTypeHierarchiesCount,
        importTypeHierarchiesOffset,
        persistentGuid,
        generations,
        savedByEngineVersion,
        compatibleWithEngineVersion,
        compressionFlags,
        packageSource,
        assetRegistryDataOffset,
        bulkDataStartOffset,
        worldTileInfoDataOffset,
        chunkIds,
        preloadDependencyCount,
        preloadDependencyOffset,
        namesReferencedFromExportDataCount,
        payloadTocOffset,
        dataResourceOffset,
    }
}
