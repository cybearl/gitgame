import { classifySourcePath } from "@main/lib/compileDb/paths"
import { diffSourceFiles } from "@main/lib/compileDb/scan"
import { buildScan } from "@tests/lib/utils/compileDb"
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
