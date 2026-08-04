import Icon from "@renderer/components/ui/Icon"

type EmptyStateProps = {
    icon: string
    title: string
    description: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center select-none">
            <Icon src={icon} size="md" className="opacity-60" />
            <div className="text-sm">{title}</div>
            <div className="text-xs opacity-60">{description}</div>
        </div>
    )
}
