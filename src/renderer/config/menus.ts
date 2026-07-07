import type { Project } from "@/main/types/store"

/**
 * A dispatchable menu action.
 */
export type MenuAction =
    | { type: "project:add-local" }
    | { type: "project:open"; path: string }
    | { type: "project:clear-recent" }
    | { type: "window:close" }
    | { type: "view:reload" }
    | { type: "shell:open-external"; url: string }

/**
 * External resources opened from the `Help` menu.
 */
const EXTERNAL_LINKS = {
    documentation: "https://github.com/cybearl/gitgame/blob/main/README.md",
    reportIssue: "https://github.com/cybearl/gitgame/issues",
} as const

/**
 * A single entry inside a menu dropdown:
 * - `item`: an actionable row with an optional keyboard accelerator hint.
 * - `separator`: a horizontal divider drawn between items.
 * - `submenu`: a nested list that opens to the right when its row is hovered.
 */
export type TopLevelMenuEntry =
    | {
          type: "item"
          label: string
          accelerator?: string
          isDisabled?: boolean
          action?: MenuAction
      }
    | { type: "separator" }
    | {
          type: "submenu"
          label: string
          items: TopLevelMenuEntry[]
      }

/**
 * A top-level menu shown in the menu bar (e.g. `Project`, `Repository`, `Help`).
 */
export type TopLevelMenu = {
    label: string
    items: TopLevelMenuEntry[]
}

/**
 * Builds the entries for the `Recent Projects` submenu, falling back to a single
 * isDisabled placeholder when there are no recent projects.
 * @param recentProjects The recent projects, most recently opened first.
 * @param currentProject The currently opened project, if any.
 * @returns The submenu entries.
 */
function buildRecentProjectsItems(recentProjects: Project[], currentProject: Project | null): TopLevelMenuEntry[] {
    if (recentProjects.length === 0) {
        return [
            {
                type: "item",
                label: "No recent projects",
                isDisabled: true,
            },
        ]
    }

    const projectItems: TopLevelMenuEntry[] = recentProjects.map(project => ({
        type: "item",
        label: currentProject?.name === project.name ? `${project.name} (current)` : project.name,
        action: {
            type: "project:open",
            path: project.path,
        },
    }))

    return [
        ...projectItems,
        { type: "separator" },
        {
            type: "item",
            label: "Clear Recent Projects",
            action: { type: "project:clear-recent" },
        },
    ]
}

/**
 * Builds the top-level application menus, injecting the dynamic recent projects
 * and enabling the repository-scoped items only when a project is open.
 * @param recentProjects The recent projects, most recently opened first.
 * @param currentProject The currently opened project, if any.
 * @returns The top-level menus.
 */
export function buildTopLevelMenus(recentProjects: Project[], currentProject: Project | null): TopLevelMenu[] {
    return [
        {
            label: "File",
            items: [
                {
                    type: "item",
                    label: "New Project...",
                    accelerator: "Ctrl+N",
                },
                {
                    type: "item",
                    label: "Add Local Project...",
                    accelerator: "Ctrl+O",
                    action: { type: "project:add-local" },
                },
                {
                    type: "item",
                    label: "Clone Project...",
                    accelerator: "Ctrl+Shift+O",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "submenu",
                    label: "Recent Projects",
                    items: buildRecentProjectsItems(recentProjects, currentProject),
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Options...",
                    accelerator: "Ctrl+,",
                    isDisabled: true,
                },
                {
                    type: "separator",
                },
                {
                    type: "item",
                    label: "Exit",
                    accelerator: "Ctrl+Q",
                    action: { type: "window:close" },
                },
            ],
        },
        {
            label: "View",
            items: [
                {
                    type: "item",
                    label: "Changes",
                    accelerator: "Ctrl+1",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "History",
                    accelerator: "Ctrl+2",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "LFS Files",
                    accelerator: "Ctrl+3",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Show Branches List",
                    accelerator: "Ctrl+B",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Go to Summary",
                    accelerator: "Ctrl+G",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Reload",
                    accelerator: "Ctrl+R",
                    action: { type: "view:reload" },
                },
            ],
        },
        {
            label: "Repository",
            items: [
                {
                    type: "item",
                    label: "Push",
                    accelerator: "Ctrl+P",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Pull",
                    accelerator: "Ctrl+Shift+P",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Fetch",
                    accelerator: "F5",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Show in Explorer",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Open in Unreal Editor",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Open in Terminal",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "View on Git Source",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Repository Settings...",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Remove...",
                    isDisabled: true,
                },
            ],
        },
        {
            label: "Branch",
            items: [
                {
                    type: "item",
                    label: "New Branch...",
                    accelerator: "Ctrl+Shift+N",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Rename...",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Delete...",
                    accelerator: "Ctrl+Shift+D",
                    isDisabled: true,
                },
                {
                    type: "separator",
                },
                {
                    type: "item",
                    label: "Discard All Changes...",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Stash All Changes",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Update from main",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Merge into Current Branch...",
                    accelerator: "Ctrl+Shift+M",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Compare to Branch...",
                    isDisabled: true,
                },
            ],
        },
        {
            label: "LFS",
            items: [
                {
                    type: "item",
                    label: "Track File Type...",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Untrack File Type...",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Lock Selected File",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Unlock Selected File",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "View Locks...",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Prune LFS Cache",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "Verify LFS Objects",
                    isDisabled: true,
                },
                {
                    type: "item",
                    label: "LFS Status",
                    isDisabled: true,
                },
            ],
        },
        {
            label: "Help",
            items: [
                {
                    type: "item",
                    label: "Documentation",
                    accelerator: "F1",
                    action: { type: "shell:open-external", url: EXTERNAL_LINKS.documentation },
                },
                {
                    type: "item",
                    label: "Keyboard Shortcuts",
                    accelerator: "Ctrl+/",
                    isDisabled: true,
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "Report an Issue...",
                    action: { type: "shell:open-external", url: EXTERNAL_LINKS.reportIssue },
                },
                { type: "separator" },
                {
                    type: "item",
                    label: "About GitGame",
                    isDisabled: true,
                },
            ],
        },
    ]
}
