import { cn } from "@cybearl/cypack/frontend"
import { Children, Fragment, isValidElement, type ReactNode } from "react"
import { Separator } from "react95"

type StatusBarProps = {
    children: ReactNode
    className?: string
}

export default function StatusBar({ children, className }: StatusBarProps) {
    const fields = Children.toArray(children).filter(isValidElement)

    return (
        <div className={cn("flex w-full shrink-0 items-stretch gap-0.5 pt-1", className)}>
            {fields.map((field, index) => (
                <Fragment key={field.key ?? index}>
                    {index > 0 && <Separator orientation="vertical" />}
                    {field}
                </Fragment>
            ))}
        </div>
    )
}
