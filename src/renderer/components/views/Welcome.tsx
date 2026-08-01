import computerIcon from "@react95-icons/Computer3_16x16_4.png"
import { useProjectContext } from "@renderer/components/contexts/Project"
import { Button } from "react95"

/**
 * Welcome / empty-state view shown when no project is open, prompts the user to open a UE
 * project folder. Open failures (missing folder, non-UE folder, ...) surface through the
 * native error-with-details dialog fired by `ProjectContext`, not inline here.
 */
export default function Welcome() {
    const projectContext = useProjectContext()

    if (projectContext.isLoading) return null

    return (
        <div className="flex h-full w-full items-center justify-center overflow-auto p-8">
            <div className="flex w-full max-w-md flex-col gap-4 p-6">
                <div className="flex flex-col items-center text-center">
                    <img src={computerIcon} alt="" decoding="sync" className="size-16 [image-rendering:pixelated]" />

                    <h1 className="mt-4 text-lg font-bold">Welcome to GitGame</h1>

                    <p className="mt-2 text-sm">
                        A Git LFS companion for Unreal Engine projects, open a folder with a{" "}
                        <b className="font-semibold">.uproject</b> file at its root to get started.
                    </p>

                    <Button onClick={projectContext.addLocalProject} className="mt-6 px-6">
                        Open Project…
                    </Button>
                </div>
            </div>
        </div>
    )
}
