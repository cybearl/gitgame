import type { AIProvider } from "@/config/ai.ts"
import GENERAL_CONFIG from "@/config/general.ts"

/**
 * Shape of the persisted user configuration file.
 */
export type UserConfig = {
    ai: {
        provider: AIProvider
        url: string
        model: string
        apiKey: string | null
    }
}

/**
 * Resolve the user's home directory in a cross-platform way.
 * @returns The user's home directory.
 */
function getHomeDir(): string {
    const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE")
    if (!home) throw new Error("Could not resolve home directory (no HOME or USERPROFILE env var)")
    return home
}

/**
 * Absolute path of the user config file.
 * @returns The absolute path of the user config file.
 */
export function getUserConfigPath(): string {
    return `${getHomeDir()}/${GENERAL_CONFIG.config.dirname}/${GENERAL_CONFIG.config.filename}`
}

/**
 * Load the user config from disk, or null if it does not exist yet.
 * @returns The user config or null if it does not exist.
 */
export async function loadUserConfig(): Promise<UserConfig | null> {
    try {
        const raw = await Deno.readTextFile(getUserConfigPath())
        return JSON.parse(raw) as UserConfig
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) return null
        throw err
    }
}

/**
 * Persist the user config to disk, creating the directory if needed.
 * @param config The user config to persist.
 */
export async function saveUserConfig(config: UserConfig): Promise<void> {
    const dir = `${getHomeDir()}/${GENERAL_CONFIG.config.dirname}`
    await Deno.mkdir(dir, { recursive: true })
    await Deno.writeTextFile(getUserConfigPath(), JSON.stringify(config, null, 4))
}
