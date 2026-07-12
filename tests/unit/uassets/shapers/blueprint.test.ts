import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parseUAsset } from "@main/lib/uassets/parseUAsset"
import { resolveMainAsset } from "@main/lib/uassets/resolveMainAsset"
import { shapeBlueprint } from "@main/lib/uassets/shapers/blueprint"
import { describe, test } from "vitest"

/**
 * Path to the fixture UAsset file.
 */
const FIXTURE_PATH = resolve(process.cwd(), ".ue5/UAssets/Blueprints/BP_Paticle_Wind_Settings.uasset")

describe.skipIf(!existsSync(FIXTURE_PATH))("shapeBlueprint: BP_Paticle_Wind_Settings.uasset (UE 5.8)", () => {
    const buffer = readFileSync(FIXTURE_PATH)
    const pkg = parseUAsset(buffer)
    const main = resolveMainAsset(pkg)
    const shape = shapeBlueprint(pkg, main)

    test("shape is tagged as a Blueprint and mirrors the fixture asset name", ({ expect }) => {
        expect(shape.kind).toBe("blueprint")
        expect(shape.name).toBe("BP_Paticle_Wind_Settings")
    })

    test("parentClass resolves to a non-empty class name", ({ expect }) => {
        expect(shape.parentClass.length).toBeGreaterThan(0)
    })

    test("components include Arrow (ArrowComponent) and Billboard (BillboardComponent)", ({ expect }) => {
        const arrow = shape.components.find(c => c.name === "Arrow")
        const billboard = shape.components.find(c => c.name === "Billboard")
        expect(arrow?.className).toBe("ArrowComponent")
        expect(billboard?.className).toBe("BillboardComponent")
    })

    test("functions and referencedAssets are arrays (possibly empty)", ({ expect }) => {
        expect(Array.isArray(shape.functions)).toBe(true)
        expect(Array.isArray(shape.referencedAssets)).toBe(true)
    })

    test("renderedSummary embeds the asset name, parent class, and section counts", ({ expect }) => {
        expect(shape.renderedSummary).toContain("BP_Paticle_Wind_Settings")
        expect(shape.renderedSummary).toContain(`parent=${shape.parentClass}`)
        expect(shape.renderedSummary).toContain(`components=${shape.components.length}`)
        expect(shape.renderedSummary).toContain(`functions=${shape.functions.length}`)
        expect(shape.renderedSummary).toContain(`refs=${shape.referencedAssets.length}`)
    })
})
