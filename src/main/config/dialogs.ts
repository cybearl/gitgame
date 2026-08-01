import type { DialogVariant } from "@/main/types/dialogs"

/**
 * The main configuration for dialogs.
 */
const DIALOGS_CONFIG: {
    sizes: Record<DialogVariant, { width: number; height: number }>
} = {
    sizes: {
        confirm: { width: 480, height: 300 },
        message: { width: 480, height: 230 },
        error: { width: 480, height: 230 },
        "error-with-details": { width: 480, height: 380 },
        update: { width: 480, height: 380 },
    },
}

export default DIALOGS_CONFIG
