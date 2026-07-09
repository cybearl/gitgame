import { useEffect, useState } from "react"

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` has
 * elapsed without further changes, so downstream consumers can skip work while
 * the source value is still churning.
 * @param value The source value to debounce.
 * @param delayMs The idle delay before the debounced value catches up, in milliseconds.
 * @returns The debounced value.
 */
export default function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState<T>(value)

    useEffect(() => {
        const handle = window.setTimeout(() => setDebounced(value), delayMs)
        return () => window.clearTimeout(handle)
    }, [value, delayMs])

    return debounced
}
