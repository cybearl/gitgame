import type { ReactNode } from "react"

type DetailsRowProps = {
    label: string
    value: ReactNode
    className?: string
}

export default function DetailsRow({ label, value, className }: DetailsRowProps) {
    return (
        <div className={className}>
            <span className="opacity-60">{label}: </span>
            <span>{value}</span>
        </div>
    )
}
