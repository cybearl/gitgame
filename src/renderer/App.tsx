import computerIcon from "@react95-icons/Computer3_16x16_4.png"
import ProjectProvider, { useProjectContext } from "@renderer/components/contexts/Project"
import TreeProvider from "@renderer/components/contexts/Tree"
import MenuBar from "@renderer/components/ui/menuBar"
import StatusBar from "@renderer/components/ui/statusBar"
import StatusBarField from "@renderer/components/ui/statusBar/StatusBarField"
import TitleBar from "@renderer/components/ui/TitleBar"
import TreeView from "@renderer/components/ui/treeView"
import useMenuShortcuts from "@renderer/hooks/useMenuShortcuts"
import { useCallback, useEffect, useMemo } from "react"
import { createScrollbars } from "react95"
import originalTheme from "react95/dist/themes/original"
import { createGlobalStyle, ThemeProvider } from "styled-components"
import MainLayout from "@/renderer/components/layouts/main"
import APP_CONFIG from "@/renderer/config/app"
import { buildTopLevelMenus, type MenuAction } from "@/renderer/config/menus"

/**
 * The application shell, rendered inside the providers so it can dispatch menu
 * actions to the application state.
 */
function AppShell() {
    const { currentProject, recentProjects, addLocalProject, openProject } = useProjectContext()

    /**
     * The main application window title (falling back to just the app name when no project is open).
     */
    const windowTitle = useMemo(() => {
        const title = `${APP_CONFIG.title} v${APP_CONFIG.version}`
        return currentProject ? `${currentProject.name} - ${title}` : title
    }, [currentProject])

    /**
     * The menus of the application, rebuilt when the recent projects change.
     */
    const menus = useMemo(() => buildTopLevelMenus(recentProjects, currentProject), [recentProjects, currentProject])

    /**
     * Dispatches a menu action to the matching application state handler.
     * @param action The action selected in the menu bar.
     */
    const handleMenuAction = useCallback(
        (action: MenuAction) => {
            switch (action.type) {
                case "project:add-local":
                    addLocalProject()
                    break
                case "project:open":
                    openProject(action.path)
                    break
                case "window:close":
                    window.api.window.close()
                    break
                case "view:reload":
                    window.location.reload()
                    break
                case "shell:open-external":
                    window.api.shell.openExternal(action.url)
                    break
            }
        },
        [addLocalProject, openProject],
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

            <div className="relative w-full flex-1 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <img
                        src="/assets/images/cthulhu.png"
                        alt=""
                        className="w-[8%] [image-rendering:pixelated] opacity-15"
                    />
                </div>

                {currentProject && (
                    <div className="relative h-full w-full">
                        <TreeView />
                    </div>
                )}
            </div>

            <StatusBar>
                <StatusBarField grow>{currentProject ? currentProject.path : "No project open"}</StatusBarField>
            </StatusBar>
        </MainLayout>
    )
}

/**
 * Applies react95's Win95 scrollbar styling globally.
 */
const GlobalScrollbars = createGlobalStyle`
    ${createScrollbars()}
`

export default function App() {
    return (
        <ThemeProvider theme={originalTheme}>
            <GlobalScrollbars />

            <ProjectProvider>
                <TreeProvider>
                    <AppShell />
                </TreeProvider>
            </ProjectProvider>
        </ThemeProvider>
    )
}
