/**
 * The bounds and step of every numeric preference field, in the unit the field
 * displays rather than the milliseconds the preference stores.
 */
const PREFERENCES_CONFIG = {
    autoLockIntervalSeconds: { min: 5, max: 600, step: 5 },
    mcpProbeIntervalSeconds: { min: 1, max: 120, step: 1 },
    compileDbDebounceSeconds: { min: 1, max: 60, step: 1 },
    updaterCheckIntervalHours: { min: 1, max: 168, step: 1 },
}

export default PREFERENCES_CONFIG
