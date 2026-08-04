import BlogCard from "./BlogCard";
import Link from "next/link";

const LATEST_BLOGS = [
    {
        title: "Architecting Zero-Cost Abstractions in Systems Languages",
        description: "How to leverage modern compiler intrinsics to build safer APIs without the runtime overhead costs usually associated with abstractions.",
        date: "NOV 24, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "12 MIN",
        categories: ["SYSTEMS", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 24,
        views: "1.2K",
        slug: "zero-cost-abstractions-1",
    },
    {
        title: "Mastering Distributed Transactions with the Saga Pattern",
        description: "A deep dive into choreographing advanced distributed microservice transactions.",
        date: "NOV 28, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "15 MIN",
        categories: ["SYSTEMS", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 24,
        views: "1.2K",
        slug: "zero-cost-abstractions-2",
    },
    {
        title: "Scaling Beyond 10 Million Concurrent Connections",
        description: "Part 3: Exploring the nuances of eBPF and kernel-bypass networking for extreme scale in high-performance networking services.",
        date: "DEC 02, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "SERIES",
        readTime: "45 MIN",
        categories: ["SCALING", "NETWORKING"],
        rating: 4.9,
        reviews: 89,
        views: "4.5K",
        slug: "scaling-10-million-connections-1",
    },
    {
        title: "Writing High-Performance Interpreters in Zig",
        description: "How to leverage modern compiler intrinsics to build safer APIs without the runtime overhead costs.",
        date: "NOV 24, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "12 MIN",
        categories: ["SYSTEMS", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 24,
        views: "1.2K",
        slug: "zero-cost-abstractions-3",
    },
    {
        title: "Building Real-Time Data Pipelines with Kafka",
        description: "How to leverage modern compiler intrinsics to build safer APIs without the runtime overhead costs usually associated with abstractions.",
        date: "NOV 24, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "12 MIN",
        categories: ["SYSTEMS", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 24,
        views: "1.2K",
        slug: "zero-cost-abstractions-4",
    },
    {
        title: "Scaling Beyond 10 Million Concurrent Connections",
        description: "Part 3: Exploring the nuances of eBPF and kernel-bypass networking for extreme scale in high-performance networking services.",
        date: "DEC 02, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "SERIES",
        readTime: "45 MIN",
        categories: ["SCALING", "NETWORKING"],
        rating: 4.9,
        reviews: 89,
        views: "4.5K",
        slug: "scaling-10-million-connections-2",
    },
    {
        title: "Architecting Zero-Cost Abstractions in Systems Languages",
        description: "How to leverage modern compiler intrinsics to build safer APIs without the runtime overhead costs usually associated with abstractions.",
        date: "NOV 24, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "12 MIN",
        categories: ["SYSTEMS", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 24,
        views: "1.2K",
        slug: "zero-cost-abstractions-5",
    },
    {
        title: "Architecting Zero-Cost Abstractions in Systems Languages",
        description: "How to leverage modern compiler intrinsics to build safer APIs without the runtime overhead costs usually associated with abstractions.",
        date: "NOV 24, 2023",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s",
        type: "ARTICLE",
        readTime: "12 MIN",
        categories: ["SYSTEMS", "ARCHITECTURE"],
        rating: 4.8,
        reviews: 24,
        views: "1.2K",
        slug: "zero-cost-abstractions-6",
    },
    {
        title: "Scaling Beyond 10 Million Concurrent Connections",
        description: "Part 3: Exploring the nuances of eBPF and kernel-bypass networking for extreme scale in high-performance networking services.",
        date: "DEC 02, 2023",
        image: "/api/saga_pattern_blog_preview_1773432699263.png",
        type: "SERIES",
        readTime: "45 MIN",
        categories: ["SCALING", "NETWORKING"],
        rating: 4.9,
        reviews: 89,
        views: "4.5K",
        slug: "scaling-10-million-connections-3",
    },
];

export default function LatestBlogs() {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    Latest Blogs
                </h2>
                <Link
                    href="/blog"
                    className="text-primary text-sm font-medium hover:underline underline-offset-4 decoration-primary/50"
                >
                    View All
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {LATEST_BLOGS.map((blog) => (
                    <BlogCard key={blog.slug} {...blog} />
                ))}
            </div>
        </div>
    );
}
