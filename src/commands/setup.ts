import { nextLogger } from "@cybearl/cypack"
import { Command } from "cliffy/command"
import { Input, Secret, Select } from "cliffy/prompt"
import { AI_DEFAULTS, AIProvider } from "@/config/ai.ts"
import { getUserConfigPath, loadUserConfig, saveUserConfig } from "@/utils/userConfig.ts"

const log = nextLogger.withPrefix("setup")

/**
 * Interactive first-time setup for AI provider settings.
 */
export const setupCommand = new Command()
    .description("Configure the AI provider used to generate commit messages")
    .action(async () => {
        const existing = await loadUserConfig()
        if (existing) {
            log.info(`Existing config found at ${getUserConfigPath()}, values will be used as defaults.`)
        }

        const provider = (await Select.prompt({
            message: "AI provider",
            options: [
                { name: "OpenAI-compatible (Ollama, OpenAI, OpenRouter, LM Studio, ...)", value: AIProvider.OpenAI },
                { name: "Anthropic (Claude)", value: AIProvider.Anthropic },
            ],
            default: existing?.ai.provider ?? AIProvider.OpenAI,
        })) as AIProvider

        const defaults = AI_DEFAULTS[provider]

        const url = await Input.prompt({
            message: "Base URL",
            default: existing?.ai.provider === provider ? existing.ai.url : defaults.url,
            minLength: 1,
        })

        const model = await Input.prompt({
            message: "Model",
            default: existing?.ai.provider === provider ? existing.ai.model : defaults.model,
            minLength: 1,
        })

        const apiKeyInput = await Secret.prompt({
            message:
                provider === AIProvider.Anthropic
                    ? "API key (required)"
                    : "API key (leave blank for local Ollama)",
            default: existing?.ai.apiKey ?? "",
        })
        const apiKey = apiKeyInput.trim().length > 0 ? apiKeyInput.trim() : null

        if (provider === AIProvider.Anthropic && !apiKey) {
            log.error("Anthropic requires an API key. Aborting.")
            Deno.exit(1)
        }

        await saveUserConfig({
            ai: {
                provider,
                url,
                model,
                apiKey,
            },
        })

        log.success(`Saved config to ${getUserConfigPath()}`)
    })
