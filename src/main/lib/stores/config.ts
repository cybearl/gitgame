import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import STORE_CONFIG from "@main/config/store"
import { app } from "electron"
import DEFAULT_APP_CONFIG from "@/main/config/app"
import type { AppConfig } from "@/main/types/store"

/**
 * The persistent JSON-backed application config, cached in memory after the
 * first read and updated through a serialized write lock so concurrent callers
 * cannot race on the temp file or clobber each other's read-modify-write.
 */
export class ConfigStore {
    /**
     * The in-memory cache, lazily loaded on first access so repeated reads do
     * not hit the disk.
     */
    private _cache: AppConfig | null = null

    /**
     * The write chain, every update tacks onto this promise so writes run one
     * at a time and each sees the result of the previous one.
     */
    private _updateLock: Promise<unknown> = Promise.resolve()

    /**
     * A per-process counter used to give each write a unique temp file name.
     */
    private _writeCounter = 0

    /**
     * Resolves the absolute path to the directory holding the config file.
     * @returns The absolute config directory path.
     */
    private _getConfigDir(): string {
        return path.join(app.getPath("appData"), STORE_CONFIG.dirName)
    }

    /**
     * Resolves the absolute path to the config file itself.
     * @returns The absolute config file path.
     */
    private _getConfigPath(): string {
        return path.join(this._getConfigDir(), STORE_CONFIG.fileName)
    }

    /**
     * Merges a possibly partial or outdated on-disk config with the defaults so
     * the rest of the app can rely on every field being present.
     * @param partial The raw parsed config, which may be missing fields.
     * @returns A complete `AppConfig`.
     */
    private _normalizeConfig(partial: Partial<AppConfig>): AppConfig {
        return {
            version: STORE_CONFIG.configVersion,
            preferences: {
                ...DEFAULT_APP_CONFIG.preferences,
                ...(partial.preferences ?? {}),
            },
            recentProjects: Array.isArray(partial.recentProjects) ? partial.recentProjects : [],
            lfsLockCache:
                partial.lfsLockCache && typeof partial.lfsLockCache === "object" && !Array.isArray(partial.lfsLockCache)
                    ? partial.lfsLockCache
                    : {},
        }
    }

    /**
     * Reads and parses the config from disk, falling back to the defaults when
     * the file is absent or unreadable/corrupt.
     * @returns The loaded config.
     */
    private async _readFromDisk(): Promise<AppConfig> {
        try {
            const raw = await readFile(this._getConfigPath(), "utf-8")
            return this._normalizeConfig(JSON.parse(raw) as Partial<AppConfig>)
        } catch {
            return structuredClone(DEFAULT_APP_CONFIG)
        }
    }

    /**
     * Persists the config to disk atomically, writes to a temp file then
     * renames, so a crash mid-write cannot corrupt the existing config.
     * @param config The config to persist.
     */
    private async _saveConfig(config: AppConfig): Promise<void> {
        const target = this._getConfigPath()
        const temp = `${target}.${process.pid}.${this._writeCounter++}.tmp`

        await mkdir(this._getConfigDir(), { recursive: true })
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
    async get(): Promise<AppConfig> {
        if (!this._cache) this._cache = await this._readFromDisk()
        return this._cache
    }

    /**
     * Applies a mutation to a copy of the current config, persists it, and
     * updates the in-memory cache.
     * @param mutator A function that mutates the draft config in place, or
     * returns a replacement config.
     * @returns The updated config.
     */
    update(mutator: (config: AppConfig) => AppConfig | undefined): Promise<AppConfig> {
        const run = this._updateLock.then(async () => {
            const current = await this.get()

            const draft = structuredClone(current)
            const result = mutator(draft) ?? draft

            await this._saveConfig(result)

            this._cache = result
            return result
        })

        // Keep the chain alive even if this update fails
        this._updateLock = run.catch(() => undefined)

        return run
    }
}

/**
 * The single app-wide config store, callers grab this rather than constructing
 * their own.
 */
export const configStore = new ConfigStore()
