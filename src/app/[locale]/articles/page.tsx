"use client";

import { useState } from "react";
import CategoryHero from "@/components/archive/CategoryHero";
import CategorySearch from "@/components/archive/CategorySearch";
import BlogCard from "@/components/home/default-view/BlogCard";

const CATEGORIES = [
    "All Insights",
    "Distributed Systems",
    "Rust Performance",
    "Cloud Infrastructure",
    "WebGPU & Graphics",
    "Machine Learning",
];

const ARTICLES = [
    {
        title: "Architecting Zero-Cost Abstractions in Systems Languages",
        description: "How to leverage modern compiler intrinsics to build safer APIs without the runtime overhead...",
        date: "NOV 24, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "12 MIN",
        categories: ["SYSTEMS", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 74,
        views: "1.2K",
        slug: "zero-cost-abstractions",
    },
    {
        title: "Isomorphic Security: Hardening the Full Stack",
        description: "Implementing unified security policies that transition seamlessly from frontend state to backend database constraints.",
        date: "OCT 14, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "22 MIN",
        categories: ["SECURITY", "FULLSTACK"],
        rating: 4.9,
        reviews: 120,
        views: "3.4K",
        slug: "isomorphic-security",
    },
    {
        title: "The Observability Gap in Distributed Actors",
        description: "Why conventional logging fails in asynchronous actor systems and how to trace messages across stateful bounds.",
        date: "SEP 02, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "ARTICLE",
        readTime: "8 MIN",
        categories: ["OBSERVABILITY", "ARCHITECTURE"],
        rating: 4.7,
        reviews: 56,
        views: "900",
        slug: "observability-gap",
    },
    {
        title: "Understanding CPU Caches & Memory Barriers",
        description: "A deep dive into L1/L2 caches, cache lines, and how memory barriers prevent instruction reordering bugs.",
        date: "AUG 15, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "18 MIN",
        categories: ["HARDWARE", "PERFORMANCE"],
        rating: 5.0,
        reviews: 210,
        views: "5.1K",
        slug: "cpu-caches",
    },
    {
        title: "Building a Custom Allocator in C++",
        description: "Step-by-step guide to writing a high-performance memory allocator for video game engines.",
        date: "JUL 22, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "ARTICLE",
        readTime: "30 MIN",
        categories: ["C++", "MEMORY"],
        rating: 4.6,
        reviews: 45,
        views: "2.2K",
        slug: "custom-allocator",
    },
    {
        title: "WebAssembly Beyond the Browser",
        description: "Exploring WASI and how WebAssembly is becoming the universal runtime for cloud-native applications.",
        date: "JUN 10, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "14 MIN",
        categories: ["WASM", "CLOUD"],
        rating: 4.9,
        reviews: 180,
        views: "4.8K",
        slug: "wasm-beyond-browser",
    }
];

export default function ArticlesPage() {
    const [activeCategory, setActiveCategory] = useState("All Insights");

    return (
        <main className="min-h-screen bg-background dark:bg-[#0B0F19]">
            <CategoryHero
                eyebrow="EDITORIAL HUB"
                titleLeft="Engineering at the"
                titleRight="Edge of Possibility"
                description="Curated deep-dives into systems architecture, performance optimization, and the future of web technologies."
            />

            <CategorySearch
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                placeholder="Explore the knowledge graph..."
            />

            <section className="w-full max-w-7xl mx-auto px-4 md:px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ARTICLES.map((article) => (
                        <BlogCard key={article.slug} {...article} />
                    ))}
                </div>
            </section>
        </main>
    );
}
