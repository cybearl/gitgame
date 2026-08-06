import computerIcon from "@react95-icons/Computer3_16x16_4.png"
import Icon from "@renderer/components/ui/Icon"
import TileProgressBar from "@/renderer/components/ui/TileProgressBar"
import APP_CONFIG from "@/renderer/config/app"

type LoadingProps = {
    progress: number
}

export default function Loading({ progress }: LoadingProps) {
    return (
        <div className="flex w-full min-h-0 flex-1 items-center justify-center overflow-hidden p-8 select-none">
            <div className="flex w-full max-w-md flex-col gap-4 p-6">
                <div className="flex flex-col items-center text-center">
                    <Icon src={computerIcon} size="lg" />
                    <h1 className="mt-4 text-lg font-bold">{APP_CONFIG.title}</h1>
                    <p className="mt-2 text-sm">Starting up...</p>
                    <TileProgressBar value={progress} hideValue className="mt-6" />
                </div>
            </div>
        </div>
    )
}
