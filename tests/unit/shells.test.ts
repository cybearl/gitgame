import { expandEnvPlaceholders } from "@main/lib/shells/editors"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("expandEnvPlaceholders", () => {
    const originalEnv = process.env

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            LOCALAPPDATA: "C:\\Users\\dev\\AppData\\Local",
            EMPTYVAR: "",
        }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it("expands a placeholder from the environment", () => {
        expect(expandEnvPlaceholders("%LOCALAPPDATA%\\Programs\\cursor\\Cursor.exe")).toBe(
            "C:\\Users\\dev\\AppData\\Local\\Programs\\cursor\\Cursor.exe",
        )
    })

    it("leaves a candidate holding no placeholder alone", () => {
        expect(expandEnvPlaceholders("/Applications/Cursor.app")).toBe("/Applications/Cursor.app")
        expect(expandEnvPlaceholders("code")).toBe("code")
    })

    it("rules out a candidate whose variable is unset or empty", () => {
        expect(expandEnvPlaceholders("%NOT_A_REAL_VARIABLE%\\Code.exe")).toBeNull()
        expect(expandEnvPlaceholders("%EMPTYVAR%\\Code.exe")).toBeNull()
    })

    it("rules the whole candidate out when only one of its variables is unset", () => {
        expect(expandEnvPlaceholders("%LOCALAPPDATA%\\%NOT_A_REAL_VARIABLE%\\Code.exe")).toBeNull()
    })
})
