/**
 * Parsed major/minor version pair extracted from `EngineAssociation`, `null` when the
 * association is a GUID (custom engine build) or an opaque identifier we can't parse.
 */
export interface UProjectEngineVersion {
    major: number
    minor: number
}

/**
 * Metadata read from a `.uproject` file at the root of a UE project's git repo.
 */
export interface UProject {
    /**
     * Absolute path to the `.uproject` file on disk.
     */
    path: string

    /**
     * Project short name, the `.uproject` filename without its extension.
     */
    name: string

    /**
     * Raw `EngineAssociation` string as it appears in the `.uproject` JSON, may be a version
     * (`"5.8"`), a full version (`"5.4.4"`), or a GUID for custom engine builds.
     */
    engineAssociation: string

    /**
     * Parsed major/minor version, `null` when `engineAssociation` is a GUID/opaque identifier.
     */
    engineVersion: UProjectEngineVersion | null
}
