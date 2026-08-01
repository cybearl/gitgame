import type { UProject } from "@/main/types/uproject"

/**
 * A project definition.
 */
export type Project = {
    path: string
    name: string
    lastOpenedAt: string
    uproject: UProject
}

/**
 * Why an attempt to open a project did not result in an open repository:
 * - `cancelled`: the user dismissed the folder picker.
 * - `not-found`: the path no longer exists on disk.
 * - `not-a-repository`: the path exists but is not inside a Git repository.
 * - `not-a-ue-project`: the repository has no `.uproject` file at its root.
 */
export type OpenProjectFailureReason = "cancelled" | "not-found" | "not-a-repository" | "not-a-ue-project"

/**
 * The outcome of attempting to open or add a project.
 */
export type OpenProjectResult =
    | { ok: true; project: Project }
    | { ok: false; reason: OpenProjectFailureReason; message?: string }
