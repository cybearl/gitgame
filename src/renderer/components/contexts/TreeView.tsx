import { useProjectContext } from "@renderer/components/contexts/Project"
import { useTreeContext } from "@renderer/components/contexts/Tree"
import WORKSPACE_CONFIG from "@renderer/config/workspace"
import useDebouncedValue from "@renderer/hooks/useDebouncedValue"
import {
    collectLockablePaths,
    collectLockedPaths,
    computeLockOwners,
    computeLockStates,
    type LockOwnerCount,
    type NodeLockState,
} from "@renderer/lib/utils/lockStates"
import {
    collectMatchingFiles,
    parsePatternList,
    persistSearchPreferences,
    type SearchFilters,
} from "@renderer/lib/utils/search"
import {
    collectAncestorPaths,
    findNodeByPath,
    pruneTreeToPredicate,
    reportLockFailures,
} from "@renderer/lib/utils/treeView"
import {
    createContext,
    type MouseEvent,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"
import type { FileTreeNode } from "@/main/types/tree"

/**
 * The state of an open context menu, anchored to a right-clicked node and
 * carrying every lock-scope count the menu needs to render.
 */
export type MenuState = {
    x: number
    y: number
    node: FileTreeNode
    canLock: boolean
    lockablePaths: string[]
    minePaths: string[]
    othersPaths: string[]
}

/**
 * The type for the tree view context, exposing every piece of state and every
 * action needed to drive the tree/search UI from anywhere in the app.
 */
export type TreeViewContextType = {
    // Selection & tree state
    expandedPaths: string[]
    selectedPath: string | undefined
    selectedNode: FileTreeNode | undefined
    visibleTree: FileTreeNode[]
    setExpandedPaths: (next: string[]) => void
    select: (path: string | undefined) => void
    reveal: (path: string) => void

    // Search state
    query: string
    isRegex: boolean
    includeText: string
    excludeText: string
    isAdvancedOpen: boolean
    isShowingMyLocksOnly: boolean
    matches: FileTreeNode[] | null
    isSearching: boolean
    setQuery: (value: string) => void
    setIsRegex: (value: boolean) => void
    setIncludeText: (value: string) => void
    setExcludeText: (value: string) => void
    setIsAdvancedOpen: (value: boolean) => void
    setIsShowingMyLocksOnly: (value: boolean) => void
    commitIncludeText: () => void
    commitExcludeText: () => void
    clearSearch: () => void

    // Derived tree-wide lock aggregates
    lockStates: Map<string, NodeLockState>
    lockOwners: Map<string, LockOwnerCount[]>

    // Context menu state & actions
    menu: MenuState | null
    openMenu: (event: MouseEvent<HTMLElement>, node: FileTreeNode) => void
    dismissMenu: () => void
    lockFromMenu: () => Promise<void>
    unlockFromMenu: () => Promise<void>
    forceUnlockFromMenu: () => Promise<void>
    revealFromMenu: () => void
}

/**
 * The `TreeView` context, providing every piece of state and every action that
 * drives the tree/search UI, so any component can read selection, control
 * expansion, reveal a file, or dispatch a lock action without prop drilling.
 */
export const TreeViewContext = createContext<TreeViewContextType | undefined>(undefined)

/**
 * The props for the `TreeViewProvider` component.
 */
type TreeViewProviderProps = {
    children: ReactNode
}

export default function TreeViewProvider({ children }: TreeViewProviderProps) {
    const { currentProject } = useProjectContext()
    const { fileTree, locksByPath, lock, unlock } = useTreeContext()

    const [expandedPaths, setExpandedPaths] = useState<string[]>([])
    const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined)
    const [menu, setMenu] = useState<MenuState | null>(null)

    const [query, setQuery] = useState("")
    const [isRegex, setIsRegex] = useState(false)
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [includeText, setIncludeText] = useState("")
    const [excludeText, setExcludeText] = useState("")
    const [isShowingMyLocksOnly, setIsShowingMyLocksOnly] = useState(false)

    // Reset selection whenever the open project changes so a stale selection
    // from a previous project cannot leak in
    // biome-ignore lint/correctness/useExhaustiveDependencies: Should be triggered when the path changes
    useEffect(() => {
        setSelectedPath(undefined)
        setExpandedPaths([])
    }, [currentProject?.path])

    // Hydrate the persisted search preferences once on mount, so the search
    // scope survives across sessions
    useEffect(() => {
        let cancelled = false

        window.api.project
            .getPreferences()
            .then(preferences => {
                if (cancelled) return

                setIsRegex(preferences.searchIsRegex)
                setIsAdvancedOpen(preferences.isAdvancedSearchOpened)
                setIncludeText(preferences.searchIncludePatterns)
                setExcludeText(preferences.searchExcludePatterns)
                setIsShowingMyLocksOnly(preferences.isShowingMyLocksOnly)
            })
            .catch(error => {
                console.error("Failed to load search preferences:", error)
            })

        return () => {
            cancelled = true
        }
    }, [])

    /**
     * The debounced filter inputs, so the expensive filter and re-render only
     * run once the user pauses typing in any of them.
     */
    const debouncedQuery = useDebouncedValue(query, WORKSPACE_CONFIG.searchDebounceMs)
    const debouncedInclude = useDebouncedValue(includeText, WORKSPACE_CONFIG.searchDebounceMs)
    const debouncedExclude = useDebouncedValue(excludeText, WORKSPACE_CONFIG.searchDebounceMs)

    /**
     * The compiled search filters, rebuilt whenever any debounced input or the
     * regex toggle changes.
     */
    const filters = useMemo<SearchFilters>(
        () => ({
            query: debouncedQuery,
            isRegex,
            include: parsePatternList(debouncedInclude),
            exclude: parsePatternList(debouncedExclude),
        }),
        [debouncedQuery, isRegex, debouncedInclude, debouncedExclude],
    )

    const isSearching = filters.query.trim().length > 0

    /**
     * The tree the user actually sees, optionally pruned to files locked by the
     * current user when the "show only my locks" filter is on. All downstream
     * derivations (search matches, tree rendering) key off this instead of the
     * raw file tree.
     */
    const visibleTree = useMemo(
        () =>
            isShowingMyLocksOnly
                ? pruneTreeToPredicate(fileTree, node => locksByPath.get(node.path)?.isMine === true)
                : fileTree,
        [isShowingMyLocksOnly, fileTree, locksByPath],
    )

    /**
     * The flat list of files matching the current filters within the visible
     * tree, or `null` when the user is not searching so the tree view keeps its
     * hierarchy.
     */
    const matches = useMemo(
        () => (isSearching ? collectMatchingFiles(visibleTree, filters) : null),
        [isSearching, visibleTree, filters],
    )

    /**
     * The computed lock states for the file tree, always derived from the full
     * tree so folder aggregates stay accurate regardless of any active search.
     */
    const lockStates = useMemo(() => computeLockStates(fileTree, locksByPath), [fileTree, locksByPath])

    /**
     * The locked-file counts by owner for every node in the full file tree.
     */
    const lockOwners = useMemo(() => computeLockOwners(fileTree, locksByPath), [fileTree, locksByPath])

    /**
     * The currently selected file tree node, resolved from the tracked path so
     * it stays in sync with tree refreshes.
     */
    const selectedNode = useMemo(
        () => (selectedPath ? findNodeByPath(fileTree, selectedPath) : undefined),
        [fileTree, selectedPath],
    )

    /**
     * Selects the given file tree node by path (or clears the selection).
     * @param path The path to select, or `undefined` to clear.
     */
    const select = useCallback((path: string | undefined) => {
        setSelectedPath(path)
    }, [])

    /**
     * Clears the search query only, leaving persisted include/exclude scope in
     * place.
     */
    const clearSearch = useCallback(() => {
        setQuery("")
    }, [])

    /**
     * Switches back to the tree view for the given path: clears the query,
     * expands every ancestor, and selects the node so a follow-up scroll effect
     * can bring it into view.
     * @param path The path to reveal.
     */
    const reveal = useCallback((path: string) => {
        setQuery("")

        const ancestors = collectAncestorPaths(path)
        if (ancestors.length > 0) {
            setExpandedPaths(previous => {
                const merged = new Set(previous)
                for (const ancestor of ancestors) merged.add(ancestor)
                return Array.from(merged)
            })
        }

        setSelectedPath(path)
    }, [])

    /**
     * Toggles/sets the regex interpretation of the query and persists it.
     * @param next The new value.
     */
    const setIsRegexPersisted = useCallback((next: boolean) => {
        setIsRegex(next)
        persistSearchPreferences({ searchIsRegex: next })
    }, [])

    /**
     * Toggles/sets the visibility of the advanced include/exclude fields and
     * persists the preference.
     * @param next The new value.
     */
    const setIsAdvancedOpenPersisted = useCallback((next: boolean) => {
        setIsAdvancedOpen(next)
        persistSearchPreferences({ isAdvancedSearchOpened: next })
    }, [])

    /**
     * Toggles/sets the "show only my locks" filter and persists the preference.
     * @param next The new value.
     */
    const setIsShowingMyLocksOnlyPersisted = useCallback((next: boolean) => {
        setIsShowingMyLocksOnly(next)
        persistSearchPreferences({ isShowingMyLocksOnly: next })
    }, [])

    /**
     * Persists the current include-globs text, e.g. when the input loses focus.
     */
    const commitIncludeText = useCallback(() => {
        persistSearchPreferences({ searchIncludePatterns: includeText })
    }, [includeText])

    /**
     * Persists the current exclude-globs text, e.g. when the input loses focus.
     */
    const commitExcludeText = useCallback(() => {
        persistSearchPreferences({ searchExcludePatterns: excludeText })
    }, [excludeText])

    /**
     * Opens the lock/unlock context menu for the given node, if it is lockable.
     * @param event The mouse event.
     * @param node The node the menu should target.
     */
    const openMenu = useCallback(
        (event: MouseEvent<HTMLElement>, node: FileTreeNode) => {
            if (!node.isLockable) return

            event.preventDefault()
            setMenu({
                x: event.clientX,
                y: event.clientY,
                node,
                canLock: (lockStates.get(node.path) ?? "unlockable") !== "locked",
                lockablePaths: collectLockablePaths(node),
                minePaths: collectLockedPaths(node, locksByPath, true),
                othersPaths: collectLockedPaths(node, locksByPath, false),
            })
        },
        [lockStates, locksByPath],
    )

    /**
     * Dismisses the context menu.
     */
    const dismissMenu = useCallback(() => setMenu(null), [])

    /**
     * Locks every lockable file covered by the menu's node.
     */
    const lockFromMenu = useCallback(async () => {
        if (!menu) return

        dismissMenu()
        reportLockFailures(await lock(menu.lockablePaths))
    }, [menu, lock, dismissMenu])

    /**
     * Unlocks the current user's own locks covered by the menu's node.
     */
    const unlockFromMenu = useCallback(async () => {
        if (!menu) return

        dismissMenu()
        reportLockFailures(await unlock(menu.minePaths, false))
    }, [menu, unlock, dismissMenu])

    /**
     * Force-unlocks other users' locks covered by the menu's node, after native
     * confirmation.
     */
    const forceUnlockFromMenu = useCallback(async () => {
        if (!menu) return

        dismissMenu()

        const confirmed = await window.api.dialog.confirm({
            title: "Force unlock",
            message: `Force unlock ${menu.othersPaths.length} file${menu.othersPaths.length === 1 ? "" : "s"} locked by other users?`,
            detail: "Forcing may discard work the lock owner has not pushed yet.",
            confirmLabel: "Force unlock",
            isDestructive: true,
        })

        if (!confirmed) return

        reportLockFailures(await unlock(menu.othersPaths, true))
    }, [menu, unlock, dismissMenu])

    /**
     * Reveals the menu's node in the tree, dismissing the menu first.
     */
    const revealFromMenu = useCallback(() => {
        if (!menu) return

        dismissMenu()
        reveal(menu.node.path)
    }, [menu, dismissMenu, reveal])

    const value = useMemo<TreeViewContextType>(
        () => ({
            expandedPaths,
            selectedPath,
            selectedNode,
            visibleTree,
            setExpandedPaths,
            select,
            reveal,
            query,
            isRegex,
            includeText,
            excludeText,
            isAdvancedOpen,
            isShowingMyLocksOnly,
            matches,
            isSearching,
            setQuery,
            setIsRegex: setIsRegexPersisted,
            setIncludeText,
            setExcludeText,
            setIsAdvancedOpen: setIsAdvancedOpenPersisted,
            setIsShowingMyLocksOnly: setIsShowingMyLocksOnlyPersisted,
            commitIncludeText,
            commitExcludeText,
            clearSearch,
            lockStates,
            lockOwners,
            menu,
            openMenu,
            dismissMenu,
            lockFromMenu,
            unlockFromMenu,
            forceUnlockFromMenu,
            revealFromMenu,
        }),
        [
            expandedPaths,
            selectedPath,
            selectedNode,
            visibleTree,
            select,
            reveal,
            query,
            isRegex,
            includeText,
            excludeText,
            isAdvancedOpen,
            isShowingMyLocksOnly,
            matches,
            isSearching,
            setIsRegexPersisted,
            setIsAdvancedOpenPersisted,
            setIsShowingMyLocksOnlyPersisted,
            commitIncludeText,
            commitExcludeText,
            clearSearch,
            lockStates,
            lockOwners,
            menu,
            openMenu,
            dismissMenu,
            lockFromMenu,
            unlockFromMenu,
            forceUnlockFromMenu,
            revealFromMenu,
        ],
    )

    return <TreeViewContext.Provider value={value}>{children}</TreeViewContext.Provider>
}

/**
 * A custom hook to access the tree view state and actions from the `TreeViewContext`.
 * @returns The tree view context value.
 */
export function useTreeViewContext() {
    const ctx = useContext(TreeViewContext)
    if (ctx === undefined) throw new Error("'useTreeViewContext' must be used within a 'TreeViewProvider'")
    return ctx
}
