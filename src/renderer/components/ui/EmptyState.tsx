type EmptyStateProps = {
    icon: string
    title: string
    description: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center select-none">
            <img
                src={icon}
                alt=""
                decoding="sync"
                fetchPriority="high"
                className="size-8 opacity-70 [image-rendering:pixelated]"
            />
            <div className="text-sm">{title}</div>
            <div className="text-xs opacity-60">{description}</div>
        </div>
    )
}
