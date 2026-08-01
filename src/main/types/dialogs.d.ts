/**
 * The kind of dialog window to render.
 */
export type DialogVariant = "confirm" | "message" | "error" | "error-with-details" | "update"

/**
 * The options for a confirmation dialog.
 */
export type ConfirmDialogOptions = {
    title: string
    message: string
    details?: string
    confirmLabel?: string
    cancelLabel?: string
    isDestructive?: boolean
}

/**
 * The options for the update dialog, whose body is driven by the updater state
 * rather than by the caller.
 */
export type UpdateDialogOptions = {
    title: string
}

/**
 * The full option set passed to the dialog window renderer, including its variant.
 */
export type DialogOptions =
    | ({
          variant: "confirm" | "message" | "error" | "error-with-details"
      } & ConfirmDialogOptions)
    | ({
          variant: "update"
      } & UpdateDialogOptions)
