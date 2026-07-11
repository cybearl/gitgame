import CONSTANTS from "@main/lib/constants"
import type {
    UAssetBlueprintComponent,
    UAssetBlueprintShape,
    UAssetExport,
    UAssetMainAsset,
    UAssetPackage,
} from "@/main/types/uassets"

/**
 * Resolve an `FPackageIndex` to just the class/object name string, negative values point into
 * the import map, positive values into the export map, `0` returns the empty string.
 * @param pkg Parsed package.
 * @param packageIndex Raw `FPackageIndex` (signed int32 from the disk format).
 * @returns The referenced object's `objectName`, or the empty string when the index is null or out of range.
 */
function resolveClassName(pkg: UAssetPackage, packageIndex: number): string {
    if (packageIndex < 0) {
        const importIndex = -packageIndex - 1
        if (importIndex >= pkg.imports.length) return ""
        return pkg.imports[importIndex].objectName
    }

    if (packageIndex > 0) {
        const exportIndex = packageIndex - 1
        if (exportIndex >= pkg.exports.length) return ""
        return pkg.exports[exportIndex].objectName
    }

    return ""
}

/**
 * Walk an import's outer chain up to the top-level entry and return that entry's `objectName`,
 * which for a class import is the module path like `"/Script/Engine"` or `"/Game/Foo/Bar"`.
 * @param pkg Parsed package.
 * @param startOuterIndex The `outerIndex` of the import whose enclosing package we want.
 * @returns The top-of-chain `objectName`, or the empty string when the chain is empty.
 */
function walkOuterToPackage(pkg: UAssetPackage, startOuterIndex: number): string {
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
 * Locate the `UBlueprintGeneratedClass` export associated with the main Blueprint, matched by
 * the `_C`-suffixed name convention.
 * @param pkg Parsed package.
 * @param main Descriptor returned by `resolveMainAsset`.
 * @returns The generated-class export, or `null` when no matching export exists.
 */
function findGeneratedClassExport(pkg: UAssetPackage, main: UAssetMainAsset): UAssetExport | null {
    const expectedName = `${main.export.objectName}${CONSTANTS.uasset.blueprint.compiledClassSuffix}`
    return pkg.exports.find((entry) => entry.objectName === expectedName) ?? null
}

/**
 * Resolve the Blueprint's parent class by looking at the `UBlueprintGeneratedClass` export's
 * `superIndex` and turning it into a class name.
 * @param pkg Parsed package.
 * @param main Descriptor returned by `resolveMainAsset`.
 * @returns The parent class name, or the empty string when the generated class or its super can't be resolved.
 */
function resolveParentClass(pkg: UAssetPackage, main: UAssetMainAsset): string {
    const generatedClass = findGeneratedClassExport(pkg, main)
    if (!generatedClass) return ""
    return resolveClassName(pkg, generatedClass.superIndex)
}

/**
 * Extract every SCS component template (exports whose name ends in `_GEN_VARIABLE`), the
 * variable name is everything before the suffix and the class name comes from resolving
 * the export's `classIndex`.
 * @param pkg Parsed package.
 * @returns Component templates in export-order.
 */
function extractComponents(pkg: UAssetPackage): UAssetBlueprintComponent[] {
    const result: UAssetBlueprintComponent[] = []

    for (const entry of pkg.exports) {
        if (!entry.objectName.endsWith(CONSTANTS.uasset.blueprint.componentSuffix)) continue

        result.push({
            name: entry.objectName.slice(0, -CONSTANTS.uasset.blueprint.componentSuffix.length),
            className: resolveClassName(pkg, entry.classIndex),
        })
    }

    return result
}

/**
 * Extract every user-defined function graph (exports whose class resolves to `"Function"`).
 * @param pkg Parsed package.
 * @returns Function names in export-order.
 */
function extractFunctions(pkg: UAssetPackage): string[] {
    const result: string[] = []

    for (const entry of pkg.exports) {
        if (resolveClassName(pkg, entry.classIndex) !== "Function") continue
        result.push(entry.objectName)
    }

    return result
}

/**
 * Collect the distinct `/Game/`-rooted package paths referenced by this Blueprint's imports,
 * deduplicated and sorted alphabetically.
 * @param pkg Parsed package.
 * @returns Sorted unique referenced asset package paths.
 */
function extractReferencedAssets(pkg: UAssetPackage): string[] {
    const seen = new Set<string>()

    for (const imp of pkg.imports) {
        const outerPackage = walkOuterToPackage(pkg, imp.outerIndex)
        if (outerPackage.startsWith(CONSTANTS.uasset.gamePackagePrefix)) seen.add(outerPackage)
    }

    return Array.from(seen).sort()
}

/**
 * Format the shaper output into a compact single-line summary suitable for an AI prompt.
 * @param shape Everything the shaper collected, minus `renderedSummary` and `kind`.
 * @returns One line like `"Blueprint(BP_Enemy, parent=Actor, components=2, functions=1, refs=3)"`.
 */
function renderSummary(shape: Omit<UAssetBlueprintShape, "kind" | "renderedSummary">): string {
    const parent = shape.parentClass || "?"
    return `Blueprint(${shape.name}, parent=${parent}, components=${shape.components.length}, functions=${shape.functions.length}, refs=${shape.referencedAssets.length})`
}

/**
 * Shape a Blueprint main asset into the Layer 2 view a commit-message tool feeds to the AI,
 * pulls parent class, SCS components, user functions, and referenced `/Game/` assets out of
 * the parsed package.
 * @param pkg Parsed package returned by `parseUAsset`.
 * @param main Main-asset descriptor returned by `resolveMainAsset` (expected `className === "Blueprint"`).
 * @returns The Blueprint shape with a pre-rendered one-line summary.
 */
export function shapeBlueprint(pkg: UAssetPackage, main: UAssetMainAsset): UAssetBlueprintShape {
    const name = main.export.objectName
    const parentClass = resolveParentClass(pkg, main)
    const components = extractComponents(pkg)
    const functions = extractFunctions(pkg)
    const referencedAssets = extractReferencedAssets(pkg)

    const renderedSummary = renderSummary({ name, parentClass, components, functions, referencedAssets })

    return {
        kind: "blueprint",
        name,
        parentClass,
        components,
        functions,
        referencedAssets,
        renderedSummary,
    }
}
