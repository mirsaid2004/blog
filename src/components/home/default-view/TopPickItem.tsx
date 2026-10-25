import { Star, Eye, Clock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TopPickItemProps {
    title: string;
    date: string;
    rating: number;
    reviews: number;
    views: string;
    type: string;
    readTime: string;
    categories: string[];
    image: string;
    badge?: string;
    isDocked: boolean;
}

export default function TopPickItem({ title, date, rating, reviews, views, type, readTime, categories, image, badge, isDocked }: TopPickItemProps) {
    return (
        <div
            className={cn(
                "flex items-stretch rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/40 dark:border-white/10 transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:border-white/60 dark:hover:border-white/20 hover:shadow-primary/10 group cursor-pointer overflow-hidden relative h-[100px]",
                isDocked ? "opacity-90" : "opacity-100"
            )}
        >
            {/* Left side Image with Overlays */}
            <div className="relative w-36 shrink-0 h-full overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Dark overlay to make text readable */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors pointer-events-none" />

                {/* Gradient to blend the image seamlessly into the right side container color */}
                {/* Gradient to blend the image seamlessly into the right side container color */}
                <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-r from-transparent via-slate-900/50 to-slate-900/80 pointer-events-none z-10 hidden dark:block" />
                <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-r from-transparent via-white/50 to-white/80 pointer-events-none z-10 block dark:hidden" />

                {/* Overlaid Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className="px-1.5 py-0.5 bg-background/80 backdrop-blur-md rounded lg:rounded-md text-[8px] font-bold text-primary uppercase tracking-widest border border-border w-fit">
                        {type}
                    </span>
                </div>

                <div className="absolute top-2 right-2 z-10">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded lg:rounded-md text-[8px] font-bold text-white border border-white/10">
                        <Clock className="w-2.5 h-2.5 text-primary" />
                        <span>{readTime}</span>
                    </div>
                </div>

                <div className="absolute bottom-2 left-2 z-10">
                    <span className="text-[8px] font-extrabold text-white drop-shadow-md shadow-black uppercase tracking-widest">
                        {date}
                    </span>
                </div>
            </div>

            {/* Right side content with animated padding */}
            <div
                className={cn(
                    "flex-1 flex flex-col justify-center min-w-0 z-10 -ml-2 transition-[padding] duration-300 ease-out",
                    isDocked ? "p-3" : "p-4"
                )}
            >
                <div className="flex justify-between items-start mb-1 gap-2">
                    <h4
                        style={{ lineHeight: "1.3" }}
                        className={cn(
                            "font-bold text-foreground line-clamp-2 group-hover:text-primary transition-all duration-300",
                            isDocked ? "text-xs" : "text-sm"
                        )}
                    >
                        {title}
                    </h4>
                    {badge && (
                        <span className="shrink-0 px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold rounded-md border border-primary/20 uppercase tracking-tighter">
                            {badge}
                        </span>
                    )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {categories.map((cat) => (
                        <span key={cat} className="text-[8px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider border border-border/50">
                            {cat}
                        </span>
                    ))}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 text-muted-foreground text-[9px] mt-auto uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
                        </div>
                        <span className="text-muted-foreground">({reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" />
                        <span>{views}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
