import type { UAssetMainAsset, UAssetPackage } from "@/main/types/uassets"

/**
 * Walk an import's outer chain up to the top-level entry (where `outerIndex === 0`) and
 * return its `objectName`, which for a class import is the module path like `"/Script/Engine"`,
 * `"None"` when the chain terminates without a proper package (rare, indicates a corrupt file).
 * @param pkg Parsed package.
 * @param startOuterIndex The `outerIndex` of the import whose enclosing package we want.
 * @returns The `objectName` of the top-of-chain import.
 */
function resolveOuterPackage(pkg: UAssetPackage, startOuterIndex: number): string {
    let outerIndex = startOuterIndex
    let last = ""

    while (outerIndex < 0) {
        const importIndex = -outerIndex - 1
        if (importIndex >= pkg.imports.length) return last
        const parent = pkg.imports[importIndex]
        last = parent.objectName
        outerIndex = parent.outerIndex
    }

    return last
}

/**
 * Resolve an `FPackageIndex` (the export's `classIndex`) to its `className` + `classPackage`,
 * negative values point into the import map, positive values into the export map, zero is
 * the null class (never valid for a main asset).
 * @param pkg Parsed package.
 * @param classIndex Raw `FPackageIndex` from the main export.
 * @returns The class's name and outer package path.
 * @throws When the index is `0` or out of range for the map it points into.
 */
function resolveClass(pkg: UAssetPackage, classIndex: number): { className: string; classPackage: string } {
    if (classIndex < 0) {
        const importIndex = -classIndex - 1

        if (importIndex >= pkg.imports.length) {
            throw new Error(`Main export classIndex=${classIndex} is out of range for the import map.`)
        }

        const classImport = pkg.imports[importIndex]
        return {
            className: classImport.objectName,
            classPackage: resolveOuterPackage(pkg, classImport.outerIndex),
        }
    }

    if (classIndex > 0) {
        const exportIndex = classIndex - 1

        if (exportIndex >= pkg.exports.length) {
            throw new Error(`Main export classIndex=${classIndex} is out of range for the export map.`)
        }

        return {
            className: pkg.exports[exportIndex].objectName,
            classPackage: "",
        }
    }

    throw new Error("Main export has a null classIndex (0), which is not a valid class reference.")
}

/**
 * Extract the short asset name from a full package path (`"/Game/Foo/Bar/BP_Enemy"` into `"BP_Enemy"`).
 * @param packagePath Full UE package path from the summary.
 * @returns The last `/`-separated segment, or the original string when it has no slashes.
 */
function shortNameOf(packagePath: string): string {
    const slash = packagePath.lastIndexOf("/")
    return slash < 0 ? packagePath : packagePath.slice(slash + 1)
}

/**
 * Locate the main export's index inside `pkg.exports`, matching by name first and falling
 * back to the first top-level export.
 * @param pkg Parsed package.
 * @param shortName Expected `objectName` of the main asset.
 * @returns Zero-based index into `pkg.exports`.
 */
function findMainExportIndex(pkg: UAssetPackage, shortName: string): number {
    const byName = pkg.exports.findIndex(entry => entry.objectName === shortName)
    if (byName !== -1) return byName

    const byOuter = pkg.exports.findIndex(entry => entry.outerIndex === 0)
    if (byOuter !== -1) return byOuter

    return 0
}

/**
 * Identify the "main" asset export inside a parsed package and resolve its class, the
 * returned `className` is what Layer 2 shapers dispatch on (`"Blueprint"`, `"Material"`,
 * `"Texture2D"`, ...), detection prefers the export whose `objectName` matches the last
 * segment of `summary.packageName` and falls back to the first top-level export
 * (`outerIndex === 0`) when no name match exists.
 * @param pkg Package returned by `parseUAsset`.
 * @returns The main asset descriptor with its class resolved.
 * @throws When the package has no exports or the main export's `classIndex` is out of range.
 */
export function resolveMainAsset(pkg: UAssetPackage): UAssetMainAsset {
    if (pkg.exports.length === 0) {
        throw new Error("Cannot resolve main asset: package has no exports.")
    }

    const shortName = shortNameOf(pkg.summary.packageName)
    const index = findMainExportIndex(pkg, shortName)
    const mainExport = pkg.exports[index]
    const classInfo = resolveClass(pkg, mainExport.classIndex)

    return {
        index,
        export: mainExport,
        className: classInfo.className,
        classPackage: classInfo.classPackage,
    }
}
