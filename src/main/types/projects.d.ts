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
 * Why opening a project did not result in an open repository, `cancelled` when
 * the picker was dismissed, `not-found`, `not-a-repository`, and `not-a-ue-project`
 * cover the disk, git, and UE root-file checks respectively.
 */
export type OpenProjectFailureReason = "cancelled" | "not-found" | "not-a-repository" | "not-a-ue-project"

/**
 * The outcome of attempting to open or add a project.
 */
export type OpenProjectResult =
    | { ok: true; project: Project }
    | { ok: false; reason: OpenProjectFailureReason; message?: string }
