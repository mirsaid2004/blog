"use client"

import { usePathname, useSearchParams } from "next/navigation"
import FilterChip from "@/components/shared/FilterChip"
import { useIsDocked } from "../scroll-dock"

interface QueryBadgeButtonProps {
    value: string
    label?: string
    className?: string
}

/** Home category filter: multi-select toggle over the `query` URL param ("all" clears it). */
export default function QueryBadgeButton({ value, label, className }: QueryBadgeButtonProps) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const isDocked = useIsDocked()

    const queries = searchParams.getAll("query")
    const isActive = value === "all" ? queries.length === 0 : queries.includes(value)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("query")
    if (value !== "all") {
        const next = isActive ? queries.filter((q) => q !== value) : [...queries, value]
        next.forEach((q) => params.append("query", q))
    }
    const qs = params.toString()
    const href = qs ? `${pathname}?${qs}` : pathname

    return (
        <FilterChip
            href={href}
            active={isActive}
            replace={false}
            // The docked card is narrow; shrink the chips so the row still fits.
            className={isDocked ? `h-7 px-2.5 text-xs ${className ?? ""}` : className}
        >
            {label || value}
        </FilterChip>
    )
}
