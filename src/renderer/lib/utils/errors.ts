/**
 * Surfaces an unexpected operation failure in a native error dialog, extracting
 * a plain message from an unknown thrown value so callers can pass the raw
 * `catch` binding without narrowing it first.
 * @param title The dialog title, describing what the app was trying to do.
 * @param error The thrown value, typically the argument of a `catch` clause.
 */
export function reportError(title: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    window.api.dialogs.error(title, message)
}
