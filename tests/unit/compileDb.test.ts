import { classifySourcePath } from "@main/lib/compileDb/paths"
import { collectDiagnostics } from "@main/lib/compileDb/run"
import { diffSourceFiles } from "@main/lib/compileDb/scan"
import { buildScan, HEADER_TOOL_FAILURE_OUTPUT } from "@tests/lib/utils/compileDb"
import { describe, expect, it } from "vitest"

describe("classifySourcePath", () => {
    it("counts the project's own sources and module descriptors", () => {
        expect(classifySourcePath("Source/ProjectWindy/ProjectWindy.cpp")).toBe("source")
        expect(classifySourcePath("Source/ProjectWindy/ProjectWindy.h")).toBe("source")
        expect(classifySourcePath("Source/ProjectWindy/ProjectWindy.Build.cs")).toBe("descriptor")
        expect(classifySourcePath("Source/ProjectWindyEditor.Target.cs")).toBe("descriptor")
    })

    it("counts a plugin's sources, which is where a runtime plugin's nodes live", () => {
        expect(classifySourcePath("Plugins/WindyToolkit/Source/WindyToolkit/Private/Thing.cpp")).toBe("source")
        expect(classifySourcePath("Plugins/WindyToolkit/Source/WindyToolkit/Public/Thing.h")).toBe("source")
        expect(classifySourcePath("Plugins/WindyToolkit/Source/WindyToolkit/WindyToolkit.Build.cs")).toBe("descriptor")
    })

    it("counts sources under a plugin nested a folder deeper", () => {
        expect(classifySourcePath("Plugins/GameFeatures/MyFeature/Source/Runtime/Thing.cpp")).toBe("source")
        expect(classifySourcePath("Plugins/Marketplace/Vendor/Plugin/Source/Thing.h")).toBe("source")
    })

    it("counts a plugin descriptor, which sits above the plugin's source tree", () => {
        expect(classifySourcePath("Plugins/WindyToolkit/WindyToolkit.uplugin")).toBe("descriptor")
        expect(classifySourcePath("Plugins/GameFeatures/MyFeature/MyFeature.uplugin")).toBe("descriptor")
    })

    it("ignores generated sources, which the build tool rewrites on every run", () => {
        expect(classifySourcePath("Source/ProjectWindy/Intermediate/Build/Module.Gen.cpp")).toBeNull()
        expect(
            classifySourcePath("Plugins/WindyToolkit/Intermediate/Build/Win64/UnrealEditor/Thing.gen.cpp"),
        ).toBeNull()
        expect(classifySourcePath("Plugins/WindyToolkit/Binaries/Win64/UnrealEditor-WindyToolkit.dll")).toBeNull()
    })

    it("ignores everything outside a source tree", () => {
        expect(classifySourcePath("Content/Blueprints/BP_Hero.uasset")).toBeNull()
        expect(classifySourcePath("Plugins/WindyToolkit/Resources/Icon128.png")).toBeNull()
        expect(classifySourcePath("Plugins/WindyToolkit/Content/Thing.uasset")).toBeNull()
        expect(classifySourcePath("ProjectWindy.uproject")).toBeNull()
        expect(classifySourcePath("Config/DefaultEngine.ini")).toBeNull()
    })

    it("ignores a stray descriptor extension outside the plugins tree", () => {
        expect(classifySourcePath("Tools/Helper.uplugin")).toBeNull()
        expect(classifySourcePath("Scripts/Build.cs")).toBeNull()
    })

    it("reads Windows separators the same as forward slashes", () => {
        expect(classifySourcePath("Plugins\\WindyToolkit\\Source\\WindyToolkit\\Private\\Thing.cpp")).toBe("source")
        expect(classifySourcePath("Plugins\\WindyToolkit\\WindyToolkit.uplugin")).toBe("descriptor")
    })

    it("matches extensions regardless of case", () => {
        expect(classifySourcePath("Source/ProjectWindy/Thing.CPP")).toBe("source")
        expect(classifySourcePath("Source/ProjectWindy/Thing.Build.CS")).toBe("descriptor")
    })
})

describe("collectDiagnostics", () => {
    const projectRoot = "F:\\Projects\\Cybearl\\project-windy"

    it("pulls the header tool's complaint out of a real failed run", () => {
        expect(collectDiagnostics(HEADER_TOOL_FAILURE_OUTPUT, projectRoot)).toEqual([
            {
                file: "Plugins/WindyToolkit/Source/WindyToolkit/Public/Wind/WindyWindFieldTypes.h",
                line: 13,
                message:
                    "Found EOF when expecting public while parsing public access modifier in class 'UWindyWindFieldTypes'",
            },
        ])
    })

    it("reads the compiler's own formats, with a column and with an error code", () => {
        const output = [
            "F:\\Projects\\Cybearl\\project-windy\\Source\\Thing.cpp(42,9): error: use of undeclared identifier 'foo'",
            "F:\\Projects\\Cybearl\\project-windy\\Source\\Other.cpp(7): fatal error C1083: Cannot open include file",
        ].join("\n")

        expect(collectDiagnostics(output, projectRoot)).toEqual([
            { file: "Source/Thing.cpp", line: 42, message: "use of undeclared identifier 'foo'" },
            { file: "Source/Other.cpp", line: 7, message: "Cannot open include file" },
        ])
    })

    it("keeps a path from outside the project whole, there being no shorter form", () => {
        const output = "C:\\UE_5.8\\Engine\\Source\\Runtime\\Core\\Public\\Thing.h(9): Error: broken"

        expect(collectDiagnostics(output, projectRoot)).toEqual([
            { file: "C:/UE_5.8/Engine/Source/Runtime/Core/Public/Thing.h", line: 9, message: "broken" },
        ])
    })

    it("collapses a complaint the build tool logged more than once", () => {
        const line = "F:\\Projects\\Cybearl\\project-windy\\Source\\Thing.cpp(42): error: broken"

        expect(collectDiagnostics([line, line, line].join("\n"), projectRoot)).toHaveLength(1)
    })

    it("finds nothing in output that only carries warnings or a plain summary", () => {
        const output = [
            "F:\\Projects\\Cybearl\\project-windy\\Source\\Thing.cpp(42): Warning: shadowed variable",
            "Result: Succeeded",
            "Total execution time: 1.41 seconds",
        ].join("\n")

        expect(collectDiagnostics(output, projectRoot)).toEqual([])
    })
})

describe("diffSourceFiles", () => {
    const baseline = buildScan([
        ["Source/ProjectWindy/ProjectWindy.cpp", "source"],
        ["Source/ProjectWindy/ProjectWindy.Build.cs", "descriptor"],
    ])

    it("reports nothing when the set is untouched, which is what an edit looks like", () => {
        expect(diffSourceFiles(baseline, buildScan([...baseline]))).toEqual({
            hasChanged: false,
            hasDescriptorChanged: false,
        })
    })

    it("reports an added source without asking for a full regeneration", () => {
        const next = buildScan([...baseline, ["Plugins/Kit/Source/Kit/New.cpp", "source"]])

        expect(diffSourceFiles(baseline, next)).toEqual({ hasChanged: true, hasDescriptorChanged: false })
    })

    it("reports a removed source", () => {
        const next = buildScan([["Source/ProjectWindy/ProjectWindy.Build.cs", "descriptor"]])

        expect(diffSourceFiles(baseline, next)).toEqual({ hasChanged: true, hasDescriptorChanged: false })
    })

    it("asks for a full regeneration when a descriptor moves either way", () => {
        const added = buildScan([...baseline, ["Plugins/Kit/Kit.uplugin", "descriptor"]])
        const removed = buildScan([["Source/ProjectWindy/ProjectWindy.cpp", "source"]])

        expect(diffSourceFiles(baseline, added)).toEqual({ hasChanged: true, hasDescriptorChanged: true })
        expect(diffSourceFiles(baseline, removed)).toEqual({ hasChanged: true, hasDescriptorChanged: true })
    })
})
