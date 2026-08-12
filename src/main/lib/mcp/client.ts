import MCP_CONFIG from "@main/config/mcp"
import CONSTANTS from "@main/lib/constants"
import { preferencesStore } from "@main/lib/stores/preferences"
import { app } from "electron"
import type { McpServerInfo } from "@/main/types/mcp"

/**
 * A JSON-RPC error surfaced by the MCP server, carries the numeric code and
 * whatever human-readable message came back, so callers can distinguish a
 * transport failure from a server-reported one.
 */
export class McpError extends Error {
    readonly code: number

    constructor(code: number, message: string) {
        super(message)
        this.name = "McpError"
        this.code = code
    }
}

/**
 * The identifier of an editor tool as advertised by the Unreal MCP, pairs the
 * toolset owning the tool with its short name so callers can dispatch to it
 * through `call_tool` without concatenating strings.
 */
export type ToolSpec = { toolset: string; name: string }

/**
 * The streamable-HTTP client for the Unreal Engine MCP, owns the JSON-RPC
 * session, request-id counter, and transport helpers behind a small class so
 * callers get a single stable instance to talk to.
 */
export class McpClient {
    /**
     * The session id handed out by the server on `initialize`, cleared whenever
     * a caller resets the session so the next probe starts a fresh handshake.
     */
    private _sessionId: string | null = null

    /**
     * The next JSON-RPC request id, incremented on every outbound call so
     * pipelined responses can be matched back.
     */
    private _nextRequestId = 1

    /**
     * POSTs a JSON-RPC payload with a hard timeout, so a hung editor cannot
     * stall the probe loop forever.
     * @param body The JSON-RPC payload to POST.
     * @param acceptStream Whether to advertise SSE in the `Accept` header,
     * needed for the `initialize` handshake since some servers stream that
     * response.
     * @returns The parsed JSON response and the response headers.
     * @throws When the request times out or the server does not respond with 2xx.
     */
    private async _post(body: unknown, acceptStream: boolean): Promise<{ json: unknown; headers: Headers }> {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), MCP_CONFIG.requestTimeoutMs)

        try {
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: acceptStream ? "application/json, text/event-stream" : "application/json",
            }

            if (this._sessionId) headers[CONSTANTS.mcp.sessionHeader] = this._sessionId

            const response = await fetch(preferencesStore.get().mcpEndpoint, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            })

            if (!response.ok) {
                const bodyPreview = (await response.text()).slice(0, 500).trim()
                const suffix = bodyPreview ? `: ${bodyPreview}` : ""
                throw new McpError(response.status, `HTTP ${response.status} ${response.statusText}${suffix}`)
            }

            const text = await response.text()
            const json = text ? this._parseResponsePayload(text, response.headers.get("content-type") ?? "") : null

            return {
                json,
                headers: response.headers,
            }
        } finally {
            clearTimeout(timeout)
        }
    }

    /**
     * Parses either a plain JSON body or the first data event of an SSE stream,
     * so the same call site can accept both response modes without branching.
     * @param text The raw response body.
     * @param contentType The `Content-Type` header of the response.
     * @returns The parsed JSON payload.
     * @throws When the payload cannot be parsed.
     */
    private _parseResponsePayload(text: string, contentType: string): unknown {
        if (contentType.includes("text/event-stream")) {
            const dataLine = text
                .split(/\r?\n/)
                .find(line => line.startsWith("data:"))
                ?.slice(5)
                .trim()

            if (!dataLine) throw new McpError(-32603, "SSE response carried no data event")

            return JSON.parse(dataLine)
        }

        return JSON.parse(text)
    }

    /**
     * Unwraps a JSON-RPC envelope, turning a `{ error }` payload into a thrown
     * `McpError` and returning the `result` when the call succeeded.
     * @param payload The parsed response body.
     * @returns The `result` field of the envelope.
     * @throws When the envelope carries a JSON-RPC error.
     */
    private _unwrapResult(payload: unknown): unknown {
        if (!payload || typeof payload !== "object") {
            throw new McpError(-32603, "MCP response was not a JSON-RPC envelope")
        }

        const envelope = payload as {
            result?: unknown
            error?: {
                code: number
                message: string
            }
        }

        if (envelope.error) throw new McpError(envelope.error.code, envelope.error.message)

        return envelope.result
    }

    /**
     * Runs the MCP `initialize` handshake and captures the session id, so later
     * calls can piggyback on the same session.
     * @returns The server's advertised identity.
     * @throws When the handshake fails or the response is malformed.
     */
    async initialize(): Promise<McpServerInfo> {
        this._sessionId = null

        const request = {
            jsonrpc: "2.0",
            id: this._nextRequestId++,
            method: "initialize",
            params: {
                protocolVersion: MCP_CONFIG.protocolVersion,
                capabilities: {},
                clientInfo: {
                    name: MCP_CONFIG.clientName,
                    version: app.getVersion(),
                },
            },
        }

        const { json, headers } = await this._post(request, true)

        const result = this._unwrapResult(json) as {
            protocolVersion?: string
            serverInfo?: {
                name?: string
                version?: string
            }
        } | null

        if (!result) throw new McpError(-32603, "MCP initialize returned no result")

        this._sessionId = headers.get(CONSTANTS.mcp.sessionHeader)

        await this._post(
            {
                jsonrpc: "2.0",
                method: "notifications/initialized",
            },
            false,
        )

        return {
            name: result.serverInfo?.name ?? "unknown",
            version: result.serverInfo?.version ?? "unknown",
            protocolVersion: result.protocolVersion ?? MCP_CONFIG.protocolVersion,
        }
    }

    /**
     * Runs the MCP `tools/list` method and returns the raw tool descriptors,
     * used to inspect what a server exposes when a `tools/call` is failing.
     * @returns The list of tools the server advertises.
     */
    async listTools(): Promise<unknown> {
        const request = {
            jsonrpc: "2.0",
            id: this._nextRequestId++,
            method: "tools/list",
            params: {},
        }

        const { json } = await this._post(request, true)

        return this._unwrapResult(json)
    }

    /**
     * Invokes an editor tool through the Unreal MCP's `call_tool` dispatcher
     * and returns its structured result, callers cast the return value to the
     * shape declared by the tool's outputSchema.
     * @param toolsetName The dotted name of the toolset owning the tool.
     * @param toolName The short name of the tool within the toolset.
     * @param args The arguments to pass to the tool.
     * @returns The `structuredContent` field of the `CallToolResult`.
     * @throws When the tool reports `isError`, or the response is malformed.
     */
    async callTool(toolsetName: string, toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
        const request = {
            jsonrpc: "2.0",
            id: this._nextRequestId++,
            method: "tools/call",
            params: {
                name: CONSTANTS.mcp.dispatcher,
                arguments: {
                    toolset_name: toolsetName,
                    tool_name: toolName,
                    arguments: args,
                },
            },
        }

        const { json } = await this._post(request, true)

        const result = this._unwrapResult(json) as {
            structuredContent?: unknown
            content?: Array<{ type: string; text?: string }>
            isError?: boolean
        } | null

        const label = `${toolsetName}.${toolName}`
        if (!result) throw new McpError(-32603, `Tool "${label}" returned no result`)

        if (result.isError) {
            const message = result.content?.find(item => item.type === "text")?.text ?? "Unknown tool error"
            throw new McpError(-32603, `Tool "${label}" failed: ${message}`)
        }

        // Dispatched tools do not propagate the underlying "outputSchema", so the
        // Unreal MCP wraps the return value as JSON in a text content item
        // rather than in "structuredContent", fall back to parsing that
        if (result.structuredContent !== undefined) return result.structuredContent

        const textItem = result.content?.find(item => item.type === "text")?.text
        if (!textItem) return null

        try {
            return JSON.parse(textItem)
        } catch {
            return textItem
        }
    }

    /**
     * Convenience wrapper around `callTool` that takes the `{ toolset, name }`
     * pairs declared in `CONSTANTS.mcp.tools`, so callers do not repeat
     * `spec.toolset, spec.name` at every call site.
     * @param spec The tool identifier from the constants.
     * @param args The arguments to pass to the tool.
     * @returns The tool's structured result.
     */
    callEditorTool(spec: ToolSpec, args?: Record<string, unknown>): Promise<unknown> {
        return this.callTool(spec.toolset, spec.name, args)
    }

    /**
     * Drops the current session so the next request goes through a fresh
     * handshake, called by the service when a transport error suggests the
     * editor is gone.
     */
    resetSession() {
        this._sessionId = null
    }
}

/**
 * The single app-wide MCP client, one editor per session so a shared instance
 * is enough, callers grab this rather than constructing their own.
 */
export const mcpClient = new McpClient()
