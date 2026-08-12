import type { AppPreferences } from "@/main/types/store"

/**
 * Checks whether two sets of preferences carry the same values.
 * @param a The first set.
 * @param b The second set.
 * @returns Whether every field matches.
 */
export function arePreferencesEqual(a: AppPreferences, b: AppPreferences): boolean {
    return (Object.keys(a) as (keyof AppPreferences)[]).every(key => a[key] === b[key])
}

/**
 * Converts a stored duration into the unit its field displays.
 * @param ms The stored duration, in milliseconds.
 * @param unitMs How many milliseconds one displayed unit is worth.
 * @returns The duration in display units.
 */
export function toDisplayUnits(ms: number, unitMs: number): number {
    return Math.round(ms / unitMs)
}

/**
 * Converts a duration typed into a field back to the stored unit.
 * @param value The duration in display units.
 * @param unitMs How many milliseconds one displayed unit is worth.
 * @returns The duration in milliseconds.
 */
export function fromDisplayUnits(value: number, unitMs: number): number {
    return Math.round(value * unitMs)
}
