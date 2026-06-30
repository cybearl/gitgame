import type { ReactNode } from "react"
import MainLayoutFrame from "@/renderer/components/layouts/main/Frame"

type MainLayoutProps = {
    children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <MainLayoutFrame>{children}</MainLayoutFrame>
        </div>
    )
}
