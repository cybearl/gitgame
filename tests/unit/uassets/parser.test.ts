import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parseUAsset } from "@main/lib/uassets/parseUAsset"
import { resolveMainAsset } from "@main/lib/uassets/resolveMainAsset"
import { describe, test } from "vitest"

/**
 * Path to the fixture UAsset file.
 */
const FIXTURE_PATH = resolve(process.cwd(), ".ue5/UAssets/Blueprints/BP_Paticle_Wind_Settings.uasset")

describe.skipIf(!existsSync(FIXTURE_PATH))("parseUAsset: BP_Paticle_Wind_Settings.uasset (UE 5.8)", () => {
    const buffer = readFileSync(FIXTURE_PATH)
    const pkg = parseUAsset(buffer)

    test("summary tag and version fields match a modern UE 5.8 file", ({ expect }) => {
        expect(pkg.summary.tag).toBe(0x9e2a83c1)
        expect(pkg.summary.legacyFileVersion).toBe(-9)
        expect(pkg.summary.fileVersionUE4).toBeGreaterThan(0)
        expect(pkg.summary.fileVersionUE5).toBeGreaterThanOrEqual(1000)
    })

    test("summary section counts and total header size are positive", ({ expect }) => {
        expect(pkg.summary.nameCount).toBeGreaterThan(0)
        expect(pkg.summary.importCount).toBeGreaterThan(0)
        expect(pkg.summary.exportCount).toBeGreaterThan(0)
        expect(pkg.summary.totalHeaderSize).toBeGreaterThan(0)
    })

    test("summary packageName looks like a UE package path", ({ expect }) => {
        expect(pkg.summary.packageName).toMatch(/^\/(Game|Engine|Script|Temp)/)
    })

    test("name table decodes to summary.nameCount entries and includes None", ({ expect }) => {
        expect(pkg.names).toHaveLength(pkg.summary.nameCount)
        expect(pkg.names).toContain("None")
    })

    test("import map exposes at least one /Script/CoreUObject import", ({ expect }) => {
        expect(pkg.imports).toHaveLength(pkg.summary.importCount)
        const coreImport = pkg.imports.find((i) => i.classPackage === "/Script/CoreUObject")
        expect(coreImport).toBeDefined()
    })

    test("every export has a non-empty name plus positive serial size and offset", ({ expect }) => {
        expect(pkg.exports).toHaveLength(pkg.summary.exportCount)

        for (const entry of pkg.exports) {
            expect(entry.objectName.length).toBeGreaterThan(0)
            expect(entry.serialSize).toBeGreaterThan(0n)
            expect(entry.serialOffset).toBeGreaterThan(0n)
        }
    })

    test("resolveMainAsset identifies the Blueprint export and its class", ({ expect }) => {
        const main = resolveMainAsset(pkg)
        expect(main.export.objectName).toBe("BP_Paticle_Wind_Settings")
        expect(main.className).toBe("Blueprint")
        expect(main.classPackage).toBe("/Script/Engine")
        expect(main.index).toBeGreaterThanOrEqual(0)
    })
})
