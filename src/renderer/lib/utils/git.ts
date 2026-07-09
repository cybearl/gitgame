/**
 * Converts a Git remote URL (in either the `scp`-style SSH form git@host:owner/repo.git`
 * or a standard URL form like `https://host/owner/repo.git`) into an HTTPS URL that
 * can be opened in a browser, or returns `null` when the input cannot be normalized.
 * @param remoteUrl The raw remote URL as reported by `git remote get-url`.
 * @returns The browsable HTTPS URL, or `null` if unparsable.
 */
export function toBrowsableRemoteUrl(remoteUrl: string): string | null {
    const trimmed = remoteUrl.trim()
    if (!trimmed) return null

    const scpMatch = /^[\w.-]+@([\w.-]+):(.+?)(?:\.git)?\/?$/.exec(trimmed)
    if (scpMatch) {
        return `https://${scpMatch[1]}/${scpMatch[2]}`
    }

    try {
        const parsed = new URL(trimmed)
        if (!parsed.host) return null

        const pathname = parsed.pathname.replace(/\.git\/?$/, "").replace(/^\/+/, "")
        if (!pathname) return null

        return `https://${parsed.host}/${pathname}`
    } catch {
        return null
    }
}
