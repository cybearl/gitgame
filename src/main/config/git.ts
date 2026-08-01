/**
 * The configuration options for the Git service.
 */

const GIT_CONFIG = {
    defaultLogOutputLimit: 100,
    checkAttributeChunkSize: 256,
    maxBufferSize: 64 * 1024 * 1024, // 64 MB
    lockConcurrency: 6,
    lockTimeoutMs: 60_000,
}

export default GIT_CONFIG
