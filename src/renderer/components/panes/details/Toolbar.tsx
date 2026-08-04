import lockIcon from "@react95-icons/Lock_16x16_4.png"
import refreshIcon from "@react95-icons/Refresh_16x16_4.png"
import { useFileTreeContext } from "@renderer/components/contexts/FileTree"
import Icon from "@renderer/components/ui/Icon"
import Tooltip from "@renderer/components/ui/Tooltip"
import { Button, Separator, Toolbar } from "react95"

type DetailsToolbarProps = {
    lockablePaths: string[]
    minePaths: string[]
    othersPaths: string[]
    onLock: () => void
    onUnlock: () => void
    onForceUnlock: () => void
}

export default function DetailsToolbar({
    lockablePaths,
    minePaths,
    othersPaths,
    onLock,
    onUnlock,
    onForceUnlock,
}: DetailsToolbarProps) {
    const { refresh } = useFileTreeContext()

    return (
        <Toolbar className="gap-0.5!">
            <Tooltip text="Refresh">
                <Button variant="flat" size="sm" square onClick={refresh}>
                    <Icon src={refreshIcon} />
                </Button>
            </Tooltip>

            <Separator orientation="vertical" />

            <Button
                variant="flat"
                size="sm"
                disabled={lockablePaths.length === 0 || minePaths.length + othersPaths.length >= lockablePaths.length}
                onClick={onLock}
            >
                <Icon src={lockIcon} isInline />
                Lock
            </Button>

            <Button variant="flat" size="sm" disabled={minePaths.length === 0} onClick={onUnlock}>
                Unlock
            </Button>

            <Button variant="flat" size="sm" disabled={othersPaths.length === 0} onClick={onForceUnlock}>
                Force unlock
            </Button>
        </Toolbar>
    )
}
