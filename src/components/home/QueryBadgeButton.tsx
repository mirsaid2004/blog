"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface QueryBadgeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
    label?: string
}

export function QueryBadgeButton({
    value,
    label,
    className,
    ...props
}: QueryBadgeButtonProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()

    const queries = searchParams.getAll("query")
    const isActive = value === "all"
        ? queries.length === 0
        : queries.includes(value)

    const handleClick = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (value === "all") {
            params.delete("query")
        } else {
            const currentQueries = params.getAll("query")
            if (currentQueries.includes(value)) {
                // Remove if already present (toggle behavior)
                const newQueries = currentQueries.filter(q => q !== value)
                params.delete("query")
                newQueries.forEach(q => params.append("query", q))
            } else {
                // Add if not present
                params.append("query", value)
            }
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <button
            onClick={handleClick}
            className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden",
                "border border-transparent",
                isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-105"
                    : "glass-capsule text-slate-400 hover:text-slate-200 hover:border-slate-700/50 hover:bg-slate-800/40",
                className
            )}
            {...props}
        >
            {/* Subtle glow effect for active state */}
            {isActive && (
                <span className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
            )}
            <span className="relative z-10">{label || value}</span>
        </button>
    )
}
