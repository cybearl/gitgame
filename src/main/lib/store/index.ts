import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import STORE_CONFIG from "@main/config/store"
import { app } from "electron"
import DEFAULT_APP_CONFIG from "@/main/config/app"
import type { AppConfig } from "@/main/types/store"

/**
 * The in-memory cache of the config, lazily loaded on first access so repeated
 * reads do not hit the disk.
 */
let cache: AppConfig | null = null

/**
 * Serializes config updates so concurrent writers cannot race on the temp file
 * or clobber each other's read-modify-write.
 */
let updateLock: Promise<unknown> = Promise.resolve()

/**
 * A per-process counter used to give each write a unique temp file name.
 */
let writeCounter = 0

/**
 * Resolves the absolute path to the directory holding the config file.
 * @returns The absolute config directory path.
 */
function getConfigDir(): string {
    return path.join(app.getPath("appData"), STORE_CONFIG.dirName)
}

/**
 * Resolves the absolute path to the config file itself.
 * @returns The absolute config file path.
 */
function getConfigPath(): string {
    return path.join(getConfigDir(), STORE_CONFIG.fileName)
}

/**
 * Merges a possibly partial or outdated on-disk config with the defaults so the
 * rest of the app can rely on every field being present.
 * @param partial The raw parsed config, which may be missing fields.
 * @returns A complete `AppConfig`.
 */
function normalizeConfig(partial: Partial<AppConfig>): AppConfig {
    return {
        version: STORE_CONFIG.configVersion,
        preferences: {
            ...DEFAULT_APP_CONFIG.preferences,
            ...(partial.preferences ?? {}),
        },
        recentProjects: Array.isArray(partial.recentProjects) ? partial.recentProjects : [],
    }
}

/**
 * Reads and parses the config from disk, falling back to the defaults when the
 * file is absent or unreadable/corrupt.
 * @returns The loaded config.
 */
async function readFromDisk(): Promise<AppConfig> {
    try {
        const raw = await readFile(getConfigPath(), "utf-8")
        return normalizeConfig(JSON.parse(raw) as Partial<AppConfig>)
    } catch {
        return structuredClone(DEFAULT_APP_CONFIG)
    }
}

/**
 * Persists the config to disk atomically (write to a temp file, then rename) so
 * a crash mid-write cannot corrupt the existing config.
 * @param config The config to persist.
 */
async function saveConfig(config: AppConfig): Promise<void> {
    const target = getConfigPath()
    const temp = `${target}.${process.pid}.${writeCounter++}.tmp`

    await mkdir(getConfigDir(), { recursive: true })
    await writeFile(temp, JSON.stringify(config, null, 4), "utf-8")

    try {
        await rename(temp, target)
    } catch (error) {
        // Leave no orphaned temp file behind if the rename fails
        await rm(temp, { force: true })
        throw error
    }
}

/**
 * Returns the current config, loading it from disk on first access.
 * @returns The cached config.
 */
export async function getConfig(): Promise<AppConfig> {
    if (!cache) cache = await readFromDisk()
    return cache
}

/**
 * Applies a mutation to a copy of the current config, persists it, and updates the in-memory cache.
 * @param mutator A function that mutates the draft config in place, or returns a replacement config.
 * @returns The updated config.
 */
export function updateConfig(mutator: (config: AppConfig) => AppConfig | undefined): Promise<AppConfig> {
    // Chain onto the lock so concurrent updates run one at a time, each reading
    // the result of the previous one
    const run = updateLock.then(async () => {
        const current = await getConfig()

        const draft = structuredClone(current)
        const result = mutator(draft) ?? draft

        await saveConfig(result)

        cache = result
        return result
    })

    // Keep the chain alive even if this update fails
    updateLock = run.catch(() => undefined)

    return run
}
