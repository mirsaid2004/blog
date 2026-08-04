import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, Star } from "lucide-react";

interface BlogCardProps {
    title: string;
    description: string;
    date: string;
    image: string;
    type: string;
    readTime: string;
    categories: string[];
    rating: number;
    reviews: number;
    views: string;
    slug: string;
}

export default function BlogCard({
    title,
    description,
    date,
    image,
    type,
    readTime,
    categories,
    rating,
    reviews,
    views,
    slug,
}: BlogCardProps) {
    return (
        <Link href={`/blog/${slug}`} className="group block h-full">
            <div className="relative h-full flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-4xl border border-white/40 dark:border-white/10 overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-2xl hover:shadow-primary/20 hover:border-white/60 dark:hover:border-white/20 outline-1 outline-transparent hover:outline-primary/30">
                {/* Image Container */}
                <div className="relative aspect-16/10 w-full overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Top Overlays */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                        <span className="px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest text-primary border border-border">
                            {type}
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/10">
                            <Clock className="w-3 h-3 text-primary" />
                            <span>{readTime}</span>
                        </div>
                    </div>

                    {/* Bottom Gradient and Categories */}
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 via-transparent to-transparent flex-col justify-end p-4 hidden dark:flex" />
                    <div className="absolute inset-0 bg-linear-to-t from-white/40 via-transparent to-transparent flex-col justify-end p-4 flex dark:hidden" />

                    <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-4 z-10 pointer-events-none">
                        <div className="flex flex-wrap gap-2 pointer-events-auto">
                            {categories.map((cat) => (
                                <span
                                    key={cat}
                                    className="px-2 py-0.5 bg-primary/20 backdrop-blur-sm rounded-md text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20"
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-6 relative z-10 bg-transparent">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3">
                        {date}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                        {description}
                    </p>

                    {/* Footer - Metrics */}
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-foreground text-xs font-medium">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span>{rating.toFixed(1)}</span>
                            </div>
                            <span className="text-muted-foreground text-xs">({reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Eye className="w-4 h-4" />
                            <span>{views}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
