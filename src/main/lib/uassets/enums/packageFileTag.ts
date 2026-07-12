/**
 * Magic numbers at the start of every `.uasset`, the swapped variant flags opposite-endian files.
 * @see /Engine/Source/Runtime/CoreUObject/Public/UObject/PackageFileSummary.h
 */
export const UAssetPackageFileTag = {
    PACKAGE_FILE_TAG: 0x9e2a83c1,
    PACKAGE_FILE_TAG_SWAPPED: 0xc1832a9e,
} as const
