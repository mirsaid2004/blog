"use client";

import TopPickItem from "./TopPickItem";
import { motion, useScroll, useTransform } from "framer-motion";

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
    const { scrollY } = useScroll();

    // Instead of padding down, we shrink the title and the gap
    // Docking point around 800px scroll
    const titleScale = useTransform(scrollY, [0, 800], [1, 0.75]);
    const titleOrigin = "left top";
    const gap = useTransform(scrollY, [0, 800], ["1rem", "0.5rem"]); // 16px to 8px

    return (
        <div className="w-full">
            {/* The gap animates, but the container naturally sticks below Search UI */}
            <motion.div style={{ gap }} className="flex flex-col">
                <motion.h2
                    style={{ scale: titleScale, transformOrigin: titleOrigin }}
                    className="text-2xl font-extrabold text-white tracking-tight mb-3"
                >
                    Top Picks
                </motion.h2>
                {TOP_PICKS.map((pick) => (
                    <TopPickItem key={pick.title} {...pick} scrollY={scrollY} />
                ))}
            </motion.div>
        </div>
    );
}
