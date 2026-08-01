/**
 * Runs `worker` over every item with at most `limit` in flight at once,
 * preserving input order in the returned array.
 * @param items The items to process.
 * @param limit The maximum number of concurrent worker calls.
 * @param worker The per-item async worker.
 * @returns The per-item results.
 */
export async function parallelLimit<T, R>(
    items: T[],
    limit: number,
    worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results: R[] = new Array(items.length)
    let cursor = 0

    /**
     * Runs the worker on the next item in the queue.
     * @returns A promise that resolves when the worker is done.
     */
    const run = async (): Promise<void> => {
        while (true) {
            const currentIndex = cursor
            cursor += 1

            if (currentIndex >= items.length) return
            results[currentIndex] = await worker(items[currentIndex], currentIndex)
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, run)
    await Promise.all(workers)

    return results
}
