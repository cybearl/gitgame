import { useProjectContext } from "@renderer/components/contexts/Project"
import { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import { useCallback } from "react"
import type { MenuAction } from "@/renderer/config/menus"
import { reportError } from "@/renderer/lib/utils/errors"
import { buildDevToolsLockFailures } from "@/renderer/lib/utils/menus"

/**
 * The value returned by the `useMenuActions` hook.
 */
type UseMenuActionsResult = {
    handleMenuAction: (action: MenuAction) => Promise<void>
}

/**
 * Builds the dispatcher mapping every menu action onto the application state that
 * handles it.
 * @returns The handler passed to the menu bar and to the accelerator bindings.
 */
export default function useMenuActions(): UseMenuActionsResult {
    const { addLocalProject, openProject, closeProject, clearRecentProjects, openInUnrealEditor } = useProjectContext()
    const { isRegex, setIsRegex, isAdvancedOpen, setIsAdvancedOpen, isShowingMyLocksOnly, setIsShowingMyLocksOnly } =
        useTreeViewContext()

    /**
     * Dispatches a menu action to the matching application state handler.
     * @param action The action selected in the menu bar.
     */
    const handleMenuAction = useCallback(
        async (action: MenuAction) => {
            switch (action.type) {
                case "project:add-local":
                    addLocalProject()
                    break
                case "project:open":
                    openProject(action.path)
                    break
                case "project:close":
                    closeProject()
                    break
                case "project:clear-recent": {
                    const confirmed = await window.api.dialogs.confirm({
                        title: "Clear recent projects",
                        message: "Clear the entire recent projects list?",
                        details: "This only forgets the entries here, your project folders on disk are left untouched.",
                        confirmLabel: "Clear",
                        isDestructive: true,
                    })

                    if (confirmed) clearRecentProjects()
                    break
                }
                case "uproject:open":
                    openInUnrealEditor()
                    break
                case "window:close":
                    window.api.windows.close()
                    break
                case "view:reload":
                    window.location.reload()
                    break
                case "shell:open-external":
                    window.api.shells.openExternal(action.url)
                    break
                case "shell:show-folder":
                    window.api.shells
                        .showFolder(action.path)
                        .catch(error => reportError("Can't open the project folder", error))

                    break
                case "shell:open-terminal":
                    window.api.shells
                        .openTerminal(action.path)
                        .catch(error => reportError("Can't open a terminal", error))

                    break
                case "search:toggle-regex":
                    setIsRegex(!isRegex)
                    break
                case "search:toggle-advanced":
                    setIsAdvancedOpen(!isAdvancedOpen)
                    break
                case "lfs:toggle-show-my-locks":
                    setIsShowingMyLocksOnly(!isShowingMyLocksOnly)
                    break
                case "preferences:open":
                    window.api.preferences.openWindow()
                    break
                case "compile-db:regenerate":
                    window.api.compileDb
                        .regenerate(action.kind)
                        .catch(error => reportError("Can't regenerate the compile database", error))

                    break
                case "updater:check":
                    window.api.updater.check(true).catch(error => reportError("Failed to check for updates", error))
                    break
                case "devtools:test-confirm":
                    window.api.dialogs.confirm({
                        title: "Test confirm",
                        message: "This is a test confirm dialog.",
                        details: "Use it to preview the Win95 confirm styling from the Dev Tools menu.",
                        confirmLabel: "Sure",
                        cancelLabel: "Nope",
                    })

                    break
                case "devtools:test-error":
                    window.api.dialogs.error("Test error", "This is a test error message.")
                    break
                case "devtools:test-error-with-details":
                    window.api.dialogs.errorWithDetails(
                        "Test error with details",
                        "5 files could not be updated.",
                        buildDevToolsLockFailures(),
                    )

                    break
                case "devtools:simulate-update":
                    window.api.updater.simulate(action.scenario)
                    break
            }
        },
        [
            addLocalProject,
            openProject,
            closeProject,
            clearRecentProjects,
            openInUnrealEditor,
            isRegex,
            setIsRegex,
            isAdvancedOpen,
            setIsAdvancedOpen,
            isShowingMyLocksOnly,
            setIsShowingMyLocksOnly,
        ],
    )

    return { handleMenuAction }
}
