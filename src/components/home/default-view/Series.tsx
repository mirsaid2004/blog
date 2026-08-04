import SeriesCard from './SeriesCard';
import { RefreshCw, Gift, Percent, ArrowUpRight, Zap, Target, BookOpen, Layers } from 'lucide-react';

export default function Series() {
    // Mock data based on the user's template
    const seriesData = [
        {
            title: "Advanced System Design",
            description: "Learn how to build scalable and resilient architectures for modern web applications.",
            date: "Mar 15, 2026",
            parts: 6,
            categories: ["Architecture", "System Design"],
            icons: [RefreshCw, Gift, Percent, ArrowUpRight],
            images: [
                "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80",
                "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80",
                "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&q=80",
                "https://images.unsplash.com/photo-1627398248735-0ba6becfc419?w=500&q=80"
            ],
            href: "#"
        },
        {
            title: "Frontend Performance",
            description: "Deep dive into React rendering, Web Vitals, and techniques to ship less JavaScript.",
            date: "Feb 28, 2026",
            parts: 4,
            categories: ["Performance", "React", "Optimization"],
            icons: [Zap, Target, BookOpen, Layers],
            images: [
                "https://images.unsplash.com/photo-1627398248735-0ba6becfc419?w=500&q=80",
                "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&q=80",
                "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?w=500&q=80",
                "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=500&q=80"
            ],
            href: "#"
        },
        {
            title: "Building Microservices",
            description: "A practical guide to breaking down monoliths and managing distributed systems.",
            date: "Jan 10, 2026",
            parts: 3,
            categories: ["Backend", "Docker", "Kubernetes"],
            icons: [Layers, RefreshCw, Zap, Gift],
            images: [
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80",
                "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80"
            ],
            href: "#"
        }
    ];

    return (
        <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    Series
                </h2>
                <a
                    href="/series"
                    className="text-primary text-sm font-medium hover:underline underline-offset-4 decoration-primary/50"
                >
                    View All
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seriesData.map((series, idx) => (
                    <SeriesCard key={idx} {...series} />
                ))}
            </div>
        </section>
    );
}