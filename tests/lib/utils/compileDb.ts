import dedent from "dedent"
import type { CompileDbFileKind } from "@/main/types/compileDb"

/**
 * Builds a scan result from a list of path and kind pairs, so a test can state the
 * file set it cares about inline instead of walking a fixture tree on disk.
 * @param entries The pairs to build the scan result from.
 * @returns The scan result.
 */
export function buildScan(entries: [string, CompileDbFileKind][]): Map<string, CompileDbFileKind> {
    return new Map(entries)
}

/**
 * The tail of a real failed run, the header tool refusing a half-written header,
 * kept verbatim so the parser is held to what the build tool really prints.
 */
export const HEADER_TOOL_FAILURE_OUTPUT = dedent`
    Using bundled DotNet SDK version: 10.0 win-x64
    Running UnrealBuildTool: dotnet "..\\..\\Engine\\Binaries\\DotNET\\UnrealBuildTool\\UnrealBuildTool.dll" -mode=GenerateClangDatabase
    Creating target...
    Clang compiler version 22.1.3 is newer than latest preferred version 20.1.8. Please use caution as this compiler has not been heavily tested
    Log file: C:\\Users\\someone\\AppData\\Local\\UnrealHeaderTool\\Saved\\Logs\\UnrealHeaderTool.log
    UHT compiled-in object format Default
    F:\\Projects\\Cybearl\\project-windy\\Plugins\\WindyToolkit\\Source\\WindyToolkit\\Public\\Wind\\WindyWindFieldTypes.h(13): Error: Found EOF when expecting public while parsing public access modifier in class 'UWindyWindFieldTypes'
    Unhandled 1 aggregate exceptions

    Result: Failed (OtherCompilationError)
    Total execution time: 1.79 seconds
`
