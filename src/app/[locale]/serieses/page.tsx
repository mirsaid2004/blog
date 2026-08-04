"use client";

import { useState } from "react";
import CategoryHero from "@/components/archive/CategoryHero";
import CategorySearch from "@/components/archive/CategorySearch";
import BlogCard from "@/components/home/default-view/BlogCard";

const CATEGORIES = [
    "All Series",
    "System Design",
    "Scale",
    "Rust Track",
    "Web Architecture",
];

const SERIES = [
    {
        title: "Scaling Beyond 10 Million Concurrent Connections",
        description: "Part 3: Exploring the nuances of eBPF and kernel-bypass networking for extreme scale socket management.",
        date: "DEC 02, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "SERIES",
        readTime: "45 MIN",
        categories: ["SCALING", "NETWORKING"],
        rating: 4.9,
        reviews: 89,
        views: "4.5K",
        slug: "scaling-beyond-10-million",
    },
    {
        title: "The WebGL & WebGPU Graphics Track",
        description: "From rendering a single triangle in WebGL to writing compute shaders in WGSL for the browser.",
        date: "NOV 05, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "SERIES",
        readTime: "1H 20M",
        categories: ["GRAPHICS", "WEBGPU"],
        rating: 4.7,
        reviews: 156,
        views: "8.9K",
        slug: "webgpu-series",
    },
    {
        title: "Building a Production Redis Clone in Rust",
        description: "A 5-part guide to writing a multi-threaded TCP server, implementing RESP, and handling persistence.",
        date: "OCT 12, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "SERIES",
        readTime: "2H 15M",
        categories: ["RUST", "DATABASES"],
        rating: 5.0,
        reviews: 420,
        views: "15K",
        slug: "redis-clone-rust",
    },
    {
        title: "Zero to Production with Next.js App Router",
        description: "Mastering Server Components, NextAuth, Stripe integration, and complex optimistic UI mutations.",
        date: "AUG 22, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "SERIES",
        readTime: "3H 45M",
        categories: ["NEXT.JS", "FULLSTACK"],
        rating: 4.8,
        reviews: 315,
        views: "11K",
        slug: "nextjs-app-router-mastery",
    }
];

export default function SeriesesPage() {
    const [activeCategory, setActiveCategory] = useState("All Series");

    return (
        <main className="min-h-screen bg-background dark:bg-[#0B0F19]">
            <CategoryHero
                eyebrow="MULTI-PART GUIDES"
                titleLeft="Master Topics with"
                titleRight="Comprehensive Series"
                description="Follow along with structured, multi-part tutorials designed to take you from fundamentals to advanced implementations."
            />

            <CategorySearch
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                placeholder="Search series..."
            />

            <section className="w-full max-w-7xl mx-auto px-4 md:px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {SERIES.map((serie) => (
                        <BlogCard key={serie.slug} {...serie} />
                    ))}
                </div>
            </section>
        </main>
    );
}
