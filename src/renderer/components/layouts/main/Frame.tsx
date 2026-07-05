import type { ReactNode } from "react"
import { Frame } from "react95"

type MainLayoutFrameProps = {
    children: ReactNode
}

export default function MainLayoutFrame({ children }: MainLayoutFrameProps) {
    return (
        <Frame variant="window" className="w-full h-full p-1.5 bg-secondary!">
            <div className="flex h-full w-full flex-col">{children}</div>
        </Frame>
    )
}
