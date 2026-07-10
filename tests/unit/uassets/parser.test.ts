import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parseUAsset } from "@main/lib/uassets/parseUAsset"
import { describe, test } from "vitest"

/**
 * Path to the fixture UAsset file.
 */
const FIXTURE_PATH = resolve(process.cwd(), ".ue5/UAssets/Blueprints/BP_Paticle_Wind_Settings.uasset")

describe.skipIf(!existsSync(FIXTURE_PATH))("parseUAsset: BP_Paticle_Wind_Settings.uasset (UE 5.8)", () => {
    const buffer = readFileSync(FIXTURE_PATH)
    const { summary, names, imports, exports } = parseUAsset(buffer)

    test("summary tag and version fields match a modern UE 5.8 file", ({ expect }) => {
        expect(summary.tag).toBe(0x9e2a83c1)
        expect(summary.legacyFileVersion).toBe(-9)
        expect(summary.fileVersionUE4).toBeGreaterThan(0)
        expect(summary.fileVersionUE5).toBeGreaterThanOrEqual(1000)
    })

    test("summary section counts and total header size are positive", ({ expect }) => {
        expect(summary.nameCount).toBeGreaterThan(0)
        expect(summary.importCount).toBeGreaterThan(0)
        expect(summary.exportCount).toBeGreaterThan(0)
        expect(summary.totalHeaderSize).toBeGreaterThan(0)
    })

    test("summary packageName looks like a UE package path", ({ expect }) => {
        expect(summary.packageName).toMatch(/^\/(Game|Engine|Script|Temp)/)
    })

    test("name table decodes to summary.nameCount entries and includes None", ({ expect }) => {
        expect(names).toHaveLength(summary.nameCount)
        expect(names).toContain("None")
    })

    test("import map exposes at least one /Script/CoreUObject import", ({ expect }) => {
        expect(imports).toHaveLength(summary.importCount)
        const coreImport = imports.find((i) => i.classPackage === "/Script/CoreUObject")
        expect(coreImport).toBeDefined()
    })

    test("every export has a non-empty name plus positive serial size and offset", ({ expect }) => {
        expect(exports).toHaveLength(summary.exportCount)

        for (const entry of exports) {
            expect(entry.objectName.length).toBeGreaterThan(0)
            expect(entry.serialSize).toBeGreaterThan(0n)
            expect(entry.serialOffset).toBeGreaterThan(0n)
        }
    })
})
