/**
 * A minimal observable state container, holds a single mutable value and
 * notifies its subscribers whenever it changes, subclass to add
 * domain-specific helpers on top of the same shared quartet.
 */
export class ObservableStore<T extends object> {
    /**
     * The current state, the only source of truth the store carries.
     */
    private _state: T

    /**
     * The set of subscribers notified on every state transition.
     */
    private _listeners = new Set<(next: T) => void>()

    constructor(initialState: T) {
        this._state = initialState
    }

    /**
     * Reads the current state.
     * @returns The current state.
     */
    get(): T {
        return this._state
    }

    /**
     * Notifies every subscriber of the current state without changing it,
     * used to re-broadcast on demand when a caller needs the listeners poked
     * without a real transition.
     */
    emit() {
        this._listeners.forEach(listener => {
            listener(this._state)
        })
    }

    /**
     * Applies a partial patch to the state and notifies subscribers.
     * @param patch The fields to change.
     */
    set(patch: Partial<T>) {
        this._state = { ...this._state, ...patch }
        this.emit()
    }

    /**
     * Subscribes to state transitions.
     * @param listener The callback invoked with each new state.
     * @returns A function that removes the subscription.
     */
    subscribe(listener: (next: T) => void): () => void {
        this._listeners.add(listener)
        return () => this._listeners.delete(listener)
    }
}
