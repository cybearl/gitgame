import AI_CONFIG, { AIProvider } from "@/config/ai.ts"
import { loadUserConfig, type UserConfig } from "@/utils/userConfig.ts"

/**
 * Build the user prompt sent alongside the system prompt.
 * @param stagedFiles The list of staged files.
 * @returns The user prompt string.
 */
function buildCommitUserPrompt(stagedFiles: string[]): string {
    return `Staged files:\n${stagedFiles.join("\n")}`
}

/**
 * Call an OpenAI-compatible /chat/completions endpoint.
 * @param cfg The user AI configuration.
 * @param system The system prompt.
 * @param user The user prompt.
 * @returns The generated commit message or null if the call fails.
 */
async function callOpenAI(cfg: UserConfig["ai"], system: string, user: string): Promise<string | null> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }

    // biome-ignore lint/complexity/useLiteralKeys: Better readability for headers
    if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`

    const res = await fetch(`${cfg.url.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            model: cfg.model,
            messages: [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
            stream: false,
        }),
        signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
}

/**
 * Call the native Anthropic `/messages` endpoint.
 * @param cfg The user AI configuration.
 * @param system The system prompt.
 * @param user The user prompt.
 * @returns The generated commit message or null if the call fails.
 */
async function callAnthropic(cfg: UserConfig["ai"], system: string, user: string): Promise<string | null> {
    if (!cfg.apiKey) return null

    const res = await fetch(`${cfg.url.replace(/\/+$/, "")}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": cfg.apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: cfg.model,
            max_tokens: 1024,
            system,
            messages: [{ role: "user", content: user }],
        }),
        signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text?.trim() ?? null
}

/**
 * Generate a commit message from staged file names (LFS diffs are binary so file names are the signal).
 * @param stagedFiles The list of staged files.
 * @returns The generated commit message or null if the call fails.
 */
export async function generateCommitMessage(stagedFiles: string[]): Promise<string | null> {
    const config = await loadUserConfig()
    if (!config) return null

    const system = AI_CONFIG.prompts.commit
    const user = buildCommitUserPrompt(stagedFiles)

    try {
        switch (config.ai.provider) {
            case AIProvider.OpenAI:
                return await callOpenAI(config.ai, system, user)
            case AIProvider.Anthropic:
                return await callAnthropic(config.ai, system, user)
        }
    } catch {
        return null
    }

    return null
}
