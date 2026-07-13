import computerIcon from "@react95-icons/Computer3_16x16_4.png"
import FileTreeProvider from "@renderer/components/contexts/FileTree"
import ProjectProvider, { useProjectContext } from "@renderer/components/contexts/Project"
import StatusProvider from "@renderer/components/contexts/Status"
import TreeViewProvider, { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import useMenuShortcuts from "@renderer/hooks/useMenuShortcuts"
import { useCallback, useEffect, useMemo } from "react"
import MenuBar from "@/renderer/components/bars/Menu"
import StatusBar from "@/renderer/components/bars/Status"
import TitleBar from "@/renderer/components/bars/Title"
import StatusBarField from "@/renderer/components/fields/StatusBar"
import StatusTaskField from "@/renderer/components/fields/StatusTask"
import AppRoot from "@/renderer/components/layouts/AppRoot"
import MainLayout from "@/renderer/components/layouts/main"
import Workspace from "@/renderer/components/spaces/Workspace"
import APP_CONFIG from "@/renderer/config/app"
import { buildTopLevelMenus, type MenuAction } from "@/renderer/config/menus"
import { toBrowsableRemoteUrl } from "@/renderer/lib/utils/git"

function AppShell() {
    const { currentProject, recentProjects, remoteUrl, addLocalProject, openProject, clearRecentProjects } =
        useProjectContext()

    const treeView = useTreeViewContext()

    /**
     * The browsable HTTPS URL of the current project's `origin` remote, or
     * `null` when there is no remote or it cannot be normalized.
     */
    const remoteBrowsableUrl = useMemo(() => (remoteUrl ? toBrowsableRemoteUrl(remoteUrl) : null), [remoteUrl])

    /**
     * The main application window title (falling back to just the app name when no project is open).
     */
    const windowTitle = useMemo(() => {
        const title = `${APP_CONFIG.title} ${window.api.app.version.startsWith("0.0.0") ? "[DEV]" : `v${window.api.app.version}`}`
        return currentProject ? `${currentProject.name} - ${title}` : title
    }, [currentProject])

    /**
     * The menus of the application, rebuilt when the recent projects or any
     * checkable toggle state changes so the check indicators stay in sync.
     */
    const menus = useMemo(
        () =>
            buildTopLevelMenus(recentProjects, currentProject, remoteBrowsableUrl, {
                isRegex: treeView.isRegex,
                isAdvancedOpen: treeView.isAdvancedOpen,
                isShowingMyLocksOnly: treeView.isShowingMyLocksOnly,
            }),
        [
            recentProjects,
            currentProject,
            remoteBrowsableUrl,
            treeView.isRegex,
            treeView.isAdvancedOpen,
            treeView.isShowingMyLocksOnly,
        ],
    )

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
                case "project:clear-recent": {
                    const confirmed = await window.api.dialogs.confirm({
                        title: "Clear recent projects",
                        message: "Clear the entire recent projects list?",
                        detail: "This only forgets the entries here, your project folders on disk are left untouched.",
                        confirmLabel: "Clear",
                        isDestructive: true,
                    })

                    if (confirmed) clearRecentProjects()
                    break
                }
                case "window:close":
                    window.api.windows.close()
                    break
                case "view:reload":
                    window.location.reload()
                    break
                case "shell:open-external":
                    window.api.shells.openExternal(action.url)
                    break
                case "search:toggle-regex":
                    treeView.setIsRegex(!treeView.isRegex)
                    break
                case "search:toggle-advanced":
                    treeView.setIsAdvancedOpen(!treeView.isAdvancedOpen)
                    break
                case "lfs:toggle-show-my-locks":
                    treeView.setIsShowingMyLocksOnly(!treeView.isShowingMyLocksOnly)
                    break
                case "devtools:test-confirm":
                    window.api.dialogs.confirm({
                        title: "Test confirm",
                        message: "This is a test confirm dialog.",
                        detail: "Use it to preview the Win95 confirm styling from the Dev Tools menu.",
                        confirmLabel: "Sure",
                        cancelLabel: "Nope",
                    })
                    break
                case "devtools:test-error":
                    window.api.dialogs.error("Test error", "This is a test error message.")
                    break
                case "devtools:test-error-with-detail":
                    window.api.dialogs.error(
                        "Test error with detail",
                        "5 files could not be updated.",
                        [
                            "Content/Characters/Hero/BP_Hero.uasset: locked by john",
                            "Content/Characters/Hero/SK_Hero.uasset: locked by jane",
                            "Content/Maps/MainMenu.umap: locked by bob",
                            "Content/UI/HUD/WBP_HUD.uasset: locked by alice",
                            "Content/VFX/P_Explosion.uasset",
                        ].join("\n"),
                    )
                    break
            }
        },
        [addLocalProject, openProject, clearRecentProjects, treeView],
    )

    // Bind the menu accelerators (Ctrl+O, Ctrl+Q, ...) to their actions
    useMenuShortcuts(menus, handleMenuAction)

    // Keep the OS window/taskbar caption in sync with the visible title bar
    useEffect(() => {
        document.title = windowTitle
    }, [windowTitle])

    return (
        <MainLayout>
            <TitleBar title={windowTitle} icon={computerIcon} />

            <MenuBar menus={menus} onAction={handleMenuAction} />

            <div className="relative w-full flex-1 overflow-hidden">{currentProject && <Workspace />}</div>

            <StatusBar>
                <StatusBarField grow>{currentProject ? currentProject.path : "No project open"}</StatusBarField>
                <StatusTaskField />
            </StatusBar>
        </MainLayout>
    )
}

export default function App() {
    return (
        <AppRoot>
            <StatusProvider>
                <ProjectProvider>
                    <FileTreeProvider>
                        <TreeViewProvider>
                            <AppShell />
                        </TreeViewProvider>
                    </FileTreeProvider>
                </ProjectProvider>
            </StatusProvider>
        </AppRoot>
    )
}
