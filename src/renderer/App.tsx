import computerIcon from "@react95-icons/Computer3_16x16_4.png"
import FileTreeProvider from "@renderer/components/contexts/FileTree"
import ProjectProvider, { useProjectContext } from "@renderer/components/contexts/Project"
import StatusProvider from "@renderer/components/contexts/Status"
import TreeViewProvider, { useTreeViewContext } from "@renderer/components/contexts/TreeView"
import useMenuActions from "@renderer/hooks/useMenuActions"
import useMenuShortcuts from "@renderer/hooks/useMenuShortcuts"
import useUpdaterStatusTask from "@renderer/hooks/useUpdaterStatusTask"
import { useEffect, useMemo } from "react"
import MenuBar from "@/renderer/components/bars/Menu"
import StatusBar from "@/renderer/components/bars/Status"
import TitleBar from "@/renderer/components/bars/Title"
import StatusBarField from "@/renderer/components/fields/StatusBar"
import StatusTaskField from "@/renderer/components/fields/StatusTask"
import StatusUpdateField from "@/renderer/components/fields/StatusUpdate"
import AppRoot from "@/renderer/components/layouts/AppRoot"
import MainLayout from "@/renderer/components/layouts/main"
import Workspace from "@/renderer/components/spaces/Workspace"
import APP_CONFIG from "@/renderer/config/app"
import { buildTopLevelMenus } from "@/renderer/config/menus"
import { toBrowsableRemoteUrl } from "@/renderer/lib/utils/git"

function AppShell() {
    const { isRegex, isAdvancedOpen, isShowingMyLocksOnly } = useTreeViewContext()
    const { currentProject, recentProjects, remoteUrl } = useProjectContext()
    const { handleMenuAction } = useMenuActions()

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
                isRegex,
                isAdvancedOpen,
                isShowingMyLocksOnly,
            }),
        [recentProjects, currentProject, remoteBrowsableUrl, isRegex, isAdvancedOpen, isShowingMyLocksOnly],
    )

    // Bind the menu accelerators (Ctrl+O, Ctrl+Q, ...) to their actions
    useMenuShortcuts(menus, handleMenuAction)

    // Surface a running update download in the status bar
    useUpdaterStatusTask()

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
                <StatusUpdateField />
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
