/**
 * Supported AI provider families:
 * - "openai" covers any OpenAI-compatible chat completions endpoint
 *   (Ollama, OpenAI, OpenRouter, LM Studio, vLLM, etc.).
 * - "anthropic" uses the native Anthropic Messages API.
 */
export enum AIProvider {
    OpenAI = "openai",
    Anthropic = "anthropic",
}

/**
 * Defaults surfaced by the setup wizard for each provider.
 */
export const AI_DEFAULTS = {
    openai: {
        url: "http://localhost:11434/v1",
        model: "llama3.2",
    },
    anthropic: {
        url: "https://api.anthropic.com/v1",
        model: "claude-haiku-4-5-20251001",
    },
} as const

/**
 * Static AI configuration (prompt templates) shared across providers, user-specific settings
 * (URL, model, key) live in the user config file.
 */
const AI_CONFIG = {
    prompts: {
        commit: `
            You are a Git commit message generator for an Unreal Engine 5 game project.

            Generate a Conventional Commits message from the staged files below.

            Format (strict):
            <type>(<optional scope>): <short summary, imperative mood, max 72 chars>

            <body: 1-3 short sentences explaining what changed and why>

            Allowed types: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert.
            - Pick the type that best matches the change (e.g. assets/maps -> chore or feat, code -> feat/fix/refactor, docs -> docs).
            - Leave one blank line between the subject and the body.
            - No markdown, no backticks, no quotes.
            - Output only the commit message, nothing else.
        `,
    },
}

export default AI_CONFIG
