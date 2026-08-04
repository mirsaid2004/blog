"use client";

import { useState } from "react";
import CategoryHero from "@/components/archive/CategoryHero";
import CategorySearch from "@/components/archive/CategorySearch";
import BlogCard from "@/components/home/default-view/BlogCard";

const CATEGORIES = [
    "All Posts",
    "Frontend",
    "Backend",
    "DevOps",
    "Tooling",
    "Career",
];

const POSTS = [
    {
        title: "Edge Runtime Comparison: Cloudflare vs. Vercel vs. Bun",
        description: "A benchmark-driven look at cold start times, memory overhead, and ecosystem maturity in 2024...",
        date: "DEC 05, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "POST",
        readTime: "8 MIN",
        categories: ["EDGE", "PERFORMANCE"],
        rating: 4.9,
        reviews: 312,
        views: "8.5K",
        slug: "edge-runtime-comparison",
    },
    {
        title: "Why I Stopped Using Redux",
        description: "Moving from global state monoliths to composable, localized state with React Query and Zustand.",
        date: "NOV 18, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "POST",
        readTime: "6 MIN",
        categories: ["REACT", "STATE"],
        rating: 4.5,
        reviews: 145,
        views: "5.2K",
        slug: "stop-using-redux",
    },
    {
        title: "Setting up a Modern Monorepo with Turborepo",
        description: "A quick guide to sharing TS configs, ESLint rules, and UI components across multiple Next.js apps.",
        date: "OCT 29, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "POST",
        readTime: "10 MIN",
        categories: ["TOOLING", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 89,
        views: "3.1K",
        slug: "modern-monorepo-turborepo",
    },
    {
        title: "10 Vim Commands That Will Save You Hours",
        description: "Stop reaching for the mouse. Here are the most impactful Vim motions for everyday text editing.",
        date: "OCT 01, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "POST",
        readTime: "5 MIN",
        categories: ["PRODUCTIVITY", "VIM"],
        rating: 4.7,
        reviews: 210,
        views: "6.7K",
        slug: "vim-commands",
    },
    {
        title: "Dockerizing a Node.js API the Right Way",
        description: "Multistage builds, non-root users, and caching `node_modules` for lightning-fast deployments.",
        date: "SEP 14, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "POST",
        readTime: "7 MIN",
        categories: ["DOCKER", "NODEJS"],
        rating: 4.9,
        reviews: 440,
        views: "12K",
        slug: "dockerizing-nodejs-api",
    },
    {
        title: "The Reality of Senior Engineering",
        description: "It's less about writing code and more about managing complexity, communication, and trade-offs.",
        date: "AUG 30, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "POST",
        readTime: "9 MIN",
        categories: ["CAREER", "CULTURE"],
        rating: 5.0,
        reviews: 850,
        views: "25K",
        slug: "reality-senior-engineering",
    }
];

export default function PostsPage() {
    const [activeCategory, setActiveCategory] = useState("All Posts");

    return (
        <main className="min-h-screen bg-background dark:bg-[#0B0F19]">
            <CategoryHero
                eyebrow="QUICK READS"
                titleLeft="Bite-sized"
                titleRight="Engineering Notes"
                description="Tips, tricks, tutorials, and opinion pieces on the daily life of building software."
            />

            <CategorySearch
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                placeholder="Search posts..."
            />

            <section className="w-full max-w-7xl mx-auto px-4 md:px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {POSTS.map((post) => (
                        <BlogCard key={post.slug} {...post} />
                    ))}
                </div>
            </section>
        </main>
    );
}
