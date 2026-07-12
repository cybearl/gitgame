import type { UAssetEnumEntry } from "@/main/types/uassets"

/**
 * UE5 package format version, read from `PackageFileSummary.FileVersionUE5`, entries drop the `VER_UE5_` prefix to match the current scoped `enum class`.
 * @see /Engine/Source/Runtime/Core/Public/UObject/ObjectVersion.h
 */
export const UAssetObjectVersionUE5 = {
    INITIAL_VERSION: {
        value: 1000,
        comment:
            "The original UE5 version, at the time this was added the UE4 version was 522, so UE5 will start from 1000 to show a clear difference",
    },
    NAMES_REFERENCED_FROM_EXPORT_DATA: {
        value: 1001,
        comment: "Support stripping names that are not referenced from export data",
    },
    PAYLOAD_TOC: { value: 1002, comment: "Added a payload table of contents to the package summary" },
    OPTIONAL_RESOURCES: {
        value: 1003,
        comment: "Added data to identify references from and to optional package",
    },
    LARGE_WORLD_COORDINATES: {
        value: 1004,
        comment: "Large world coordinates converts a number of core types to double components by default.",
    },
    REMOVE_OBJECT_EXPORT_PACKAGE_GUID: { value: 1005, comment: "Remove package GUID from FObjectExport" },
    TRACK_OBJECT_EXPORT_IS_INHERITED: { value: 1006, comment: "Add IsInherited to the FObjectExport entry" },
    FSOFTOBJECTPATH_REMOVE_ASSET_PATH_FNAMES: {
        value: 1007,
        comment: "Replace FName asset path in FSoftObjectPath with (package name, asset name) pair FTopLevelAssetPath",
    },
    ADD_SOFTOBJECTPATH_LIST: {
        value: 1008,
        comment: "Add a soft object path list to the package summary for fast remap",
    },
    DATA_RESOURCES: { value: 1009, comment: "Added bulk/data resource table" },
    SCRIPT_SERIALIZATION_OFFSET: {
        value: 1010,
        comment: "Added script property serialization offset to export table entries for saved, versioned packages",
    },
    PROPERTY_TAG_EXTENSION_AND_OVERRIDABLE_SERIALIZATION: {
        value: 1011,
        comment:
            "Adding property tag extension, Support for overridable serialization on UObject, Support for overridable logic in containers",
    },
    PROPERTY_TAG_COMPLETE_TYPE_NAME: {
        value: 1012,
        comment: "Added property tag complete type name and serialization type",
    },
    ASSETREGISTRY_PACKAGEBUILDDEPENDENCIES: {
        value: 1013,
        comment: "Changed UE::AssetRegistry::WritePackageData to include PackageBuildDependencies",
    },
    METADATA_SERIALIZATION_OFFSET: {
        value: 1014,
        comment: "Added meta data serialization offset to for saved, versioned packages",
    },
    VERSE_CELLS: { value: 1015, comment: "Added VCells to the object graph" },
    PACKAGE_SAVED_HASH: {
        value: 1016,
        comment: "Changed PackageFileSummary to write FIoHash PackageSavedHash instead of FGuid Guid",
    },
    OS_SUB_OBJECT_SHADOW_SERIALIZATION: { value: 1017, comment: "OS shadow serialization of subobjects" },
    IMPORT_TYPE_HIERARCHIES: {
        value: 1018,
        comment: "Adds a table of hierarchical type information for imports in a package",
    },
    AUTOMATIC_VERSION_PLUS_ONE: { value: 1019, comment: "Last version +1" },
    AUTOMATIC_VERSION: { value: 1018, comment: "AUTOMATIC_VERSION_PLUS_ONE - 1" },
} as const satisfies Record<string, UAssetEnumEntry>
