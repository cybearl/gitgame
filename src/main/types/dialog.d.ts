/**
 * The kind of dialog window to render: a two-button confirmation or a
 * single-button error notice.
 */
export type DialogVariant = "confirm" | "error"

/**
 * The options for a confirmation dialog.
 */
export type ConfirmDialogOptions = {
    title: string
    message: string
    detail?: string
    confirmLabel?: string
    cancelLabel?: string
    isDestructive?: boolean
}

/**
 * The full option set passed to the dialog window renderer, including its variant.
 */
export type DialogOptions = ConfirmDialogOptions & {
    variant: DialogVariant
}
