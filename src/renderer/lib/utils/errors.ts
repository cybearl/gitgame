/**
 * Surfaces an unexpected operation failure in a native error dialog, extracting
 * a plain message from an unknown thrown value so callers can pass the raw
 * `catch` binding without narrowing it first.
 * @param title The dialog title, describing what the app was trying to do.
 * @param err The thrown value, typically the argument of a `catch` clause.
 */
export function reportError(title: string, err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    window.api.dialogs.error(title, message)
}
