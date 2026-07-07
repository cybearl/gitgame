import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

/**
 * The type describing a single active task shown in the status bar.
 */
export type StatusTask = {
    id: string
    label: string
    progress: number | null
}

/**
 * The handle returned by `startTask`, used to update or dismiss a running task.
 */
export type StatusTaskHandle = {
    setLabel: (label: string) => void
    setProgress: (progress: number | null) => void
    finish: () => void
}

/**
 * The type for the status context.
 */
export type StatusContextType = {
    tasks: StatusTask[]
    startTask: (label: string) => StatusTaskHandle
    runTask: <T>(label: string, action: (handle: StatusTaskHandle) => Promise<T>) => Promise<T>
}

/**
 * The `Status` context, exposing the stack of active tasks and the APIs used to
 * push, update and finish them.
 */
export const StatusContext = createContext<StatusContextType | undefined>(undefined)

/**
 * The props for the `StatusProvider` component.
 */
type StatusProviderProps = {
    children: ReactNode
}

/**
 * Provides the status task stack to the component tree, backed by an in-memory
 * store.
 */
export default function StatusProvider({ children }: StatusProviderProps) {
    const [tasks, setTasks] = useState<StatusTask[]>([])

    /**
     * A ref to generate unique IDs for tasks.
     */
    const nextId = useRef(0)

    /**
     * Pushes a new task onto the stack and returns a handle to control it.
     * @param label The label displayed alongside the progress bar.
     * @returns The handle used to update or dismiss the task.
     */
    const startTask = useCallback((label: string): StatusTaskHandle => {
        nextId.current += 1
        const id = `task-${nextId.current}`

        setTasks(previous => [...previous, { id, label, progress: null }])

        return {
            setLabel: nextLabel =>
                setTasks(previous =>
                    previous.map(task =>
                        task.id === id
                            ? {
                                  ...task,
                                  label: nextLabel,
                              }
                            : task,
                    ),
                ),
            setProgress: nextProgress =>
                setTasks(previous =>
                    previous.map(task =>
                        task.id === id
                            ? {
                                  ...task,
                                  progress: nextProgress,
                              }
                            : task,
                    ),
                ),
            finish: () => setTasks(previous => previous.filter(task => task.id !== id)),
        }
    }, [])

    /**
     * Runs an async action while surfacing its lifecycle as a status task, ensuring
     * the task is always removed when the action settles.
     * @param label The label displayed alongside the progress bar.
     * @param action The async action to run, receiving the task handle for
     * mid-flight updates.
     * @returns The value resolved by the action.
     */
    const runTask = useCallback(
        async <T,>(label: string, action: (handle: StatusTaskHandle) => Promise<T>): Promise<T> => {
            const handle = startTask(label)

            try {
                return await action(handle)
            } finally {
                handle.finish()
            }
        },
        [startTask],
    )

    const value = useMemo<StatusContextType>(
        () => ({
            tasks,
            startTask,
            runTask,
        }),
        [tasks, startTask, runTask],
    )

    return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>
}

/**
 * A custom hook to access the task stack and control APIs from the `StatusContext`.
 * @returns The status context value.
 */
export function useStatusContext() {
    const ctx = useContext(StatusContext)
    if (ctx === undefined) throw new Error("'useStatusContext' must be used within a 'StatusProvider'")
    return ctx
}
