"use client";

import TopPickItem, { type TopPickItemData } from "./TopPickItem";
import { cn } from "@/lib/utils";
import { useIsDocked } from "../scroll-dock";

export default function TopPicksList({ title, picks }: { title: string; picks: TopPickItemData[] }) {
    // Densifies once the search card docks above it. A single CSS transition
    // instead of scroll-linked gap/scale, which relayout on every frame.
    const isDocked = useIsDocked();

    return (
        <div className="w-full">
            <div
                className={cn(
                    "flex flex-col transition-[gap] duration-300 ease-out",
                    isDocked ? "gap-2" : "gap-4"
                )}
            >
                <h2
                    className={cn(
                        "text-2xl font-extrabold text-foreground tracking-tight mb-3 origin-top-left transition-transform duration-300 ease-out",
                        isDocked ? "scale-75" : "scale-100"
                    )}
                >
                    {title}
                </h2>
                {picks.map((pick) => (
                    <TopPickItem key={pick.href} {...pick} isDocked={isDocked} />
                ))}
            </div>
        </div>
    );
}
