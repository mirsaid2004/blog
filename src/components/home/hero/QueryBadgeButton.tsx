"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "../../ui/button"
import { motion, MotionValue, useTransform, useMotionValue } from "framer-motion"

interface QueryBadgeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
    label?: string
    scrollY?: MotionValue<number>
}

// We wrap the standard Button in a motion component so it can accept style objects smoothly
// By casting to any, we bypass a known Framer Motion TypeScript conflict with complex Button props
const MotionButton = motion(Button as any)

export default function QueryBadgeButton({
    value,
    label,
    className,
    scrollY,
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

    // Animate dimensions from large (Hero) down to small (Sidebar)
    const fallbackScroll = useMotionValue(0)
    const activeScroll = scrollY || fallbackScroll

    const paddingTop = useTransform(activeScroll, [0, 800], ["0.5rem", "0.25rem"]); // py-2 to py-1
    const paddingBottom = useTransform(activeScroll, [0, 800], ["0.5rem", "0.25rem"]);
    const paddingLeft = useTransform(activeScroll, [0, 800], ["1.5rem", "1rem"]); // px-6 to px-4
    const paddingRight = useTransform(activeScroll, [0, 800], ["1.5rem", "1rem"]);
    const fontSize = useTransform(activeScroll, [0, 800], ["0.875rem", "0.75rem"]); // text-sm to text-xs

    return (
        <MotionButton
            variant={'outline'}
            onClick={handleClick}
            style={scrollY ? { paddingTop, paddingBottom, paddingLeft, paddingRight, fontSize } : {}}
            className={cn(
                "rounded-full font-medium transition-colors duration-300 relative overflow-hidden",
                isActive
                    ? "bg-primary! hover:text-slate-200 hover:bg-background! text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-105"
                    : "glass-capsule text-foreground hover:text-slate-200 hover:border-slate-700/50 hover:bg-slate-800/40",
                !scrollY && "px-6 py-2 text-sm", // Fallback if no scrollY provided
                className
            )}
            {...props}
        >
            {/* Subtle glow effect for active state */}
            {isActive && (
                <span className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
            )}
            <span className="relative z-10">{label || value}</span>
        </MotionButton>
    )
}
