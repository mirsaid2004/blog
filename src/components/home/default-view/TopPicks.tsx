"use client";

import TopPickItem from "./TopPickItem";
import { cn } from "@/lib/utils";
import { useIsDocked } from "../scroll-dock";

const TOP_PICKS = [
    {
        title: "Clean Architecture in Node.js",
        date: "DEC 10, 2023",
        rating: 4.9,
        reviews: 342,
        views: "1.2K",
        badge: "TRENDING",
        type: "ARTICLE",
        readTime: "8 MIN",
        categories: ["NODE.JS", "ARCHITECTURE"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s"
    },
    {
        title: "React Server Components",
        date: "NOV 15, 2023",
        rating: 4.8,
        reviews: 215,
        views: "980",
        badge: "HOT",
        type: "SERIES",
        readTime: "12 MIN",
        categories: ["REACT", "NEXT.JS"],
        image: "/api/saga_pattern_blog_preview_1773432699263.png"
    },
    {
        title: "The Rust Borrow Checker",
        date: "OCT 05, 2023",
        rating: 5.0,
        reviews: 512,
        views: "850",
        badge: "TOP RATED",
        type: "POST",
        readTime: "15 MIN",
        categories: ["RUST", "SYSTEMS"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s"
    },
];

export default function TopPicks() {
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
                        "text-2xl font-extrabold text-white tracking-tight mb-3 origin-top-left transition-transform duration-300 ease-out",
                        isDocked ? "scale-75" : "scale-100"
                    )}
                >
                    Top Picks
                </h2>
                {TOP_PICKS.map((pick) => (
                    <TopPickItem key={pick.title} {...pick} isDocked={isDocked} />
                ))}
            </div>
        </div>
    );
}
