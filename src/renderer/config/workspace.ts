/**
 * The configuration for the workspace layout.
 */
const WORKSPACE_CONFIG = {
    /**
     * The minimum allowed width for the files pane, in pixels.
     */
    filesPaneMinWidth: 200,

    /**
     * The maximum allowed width for the files pane, in pixels.
     */
    filesPaneMaxWidth: 800,

    /**
     * The default width for the files pane when no preference is stored, in pixels.
     */
    filesPaneDefaultWidth: 320,

    /**
     * The debounce delay applied to the files-pane search input before the query
     * is propagated to the tree filter, in milliseconds.
     */
    searchDebounceMs: 150,

    /**
     * The fixed pixel height of every row in the virtualized flat search results
     * list, sized to fit the two-line layout (filename + parent path).
     */
    searchResultRowHeight: 48,
}

export default WORKSPACE_CONFIG
