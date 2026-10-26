import React from 'react';
import { LucideIcon } from 'lucide-react';
import style from './SeriesCard.module.css';

export interface SeriesCardProps {
    title: string;
    description: string;
    date: string;
    parts: number;
    categories: string[];
    icons: LucideIcon[];
    images: string[];
    // Optionally pass a link to navigate
    href?: string;
}

export default function SeriesCard({ title, description, date, parts, categories, icons, images, href }: SeriesCardProps) {
    // Only map over the first 4 images to limit the stack size
    const displayImages = images.slice(0, 4);

    const content = (
        <div className="group flex flex-row items-center bg-white/70 dark:bg-slate-900/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/40 dark:border-white/10 rounded-2xl p-4 gap-4 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-900/80 hover:border-white/60 dark:hover:border-white/20 hover:shadow-primary/10 transition-all duration-300 w-full h-full">

            {/* Left side: Animated Stacked Images */}
            <div className={style.card_field}>
                <div className={style.card_groups}>
                    <div className={style.card_group} data-status="active">
                        {displayImages.map((img, i) => {
                            const Icon = icons[i];
                            return (
                                <React.Fragment key={i}>
                                    {/* Small Card (Behind) */}
                                    <div className={style.little_card}>
                                        {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
                                    </div>

                                    {/* Big Card (Image) */}
                                    <div
                                        className={style.big_card}
                                        style={{ backgroundImage: `url(${img})` }}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right side: Necessary Information */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-bold tracking-wider">
                        {date}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                        {parts} Parts
                    </span>
                    {images.length > 4 && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                            <span className="text-[10px] text-muted-foreground font-medium tracking-wider">
                                +{images.length - 4} more
                            </span>
                        </>
                    )}
                </div>

                <h3 className="text-sm font-bold text-foreground mb-1.5 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {description}
                </p>

                <div className="mt-auto flex flex-wrap gap-1">
                    {categories.map((cat, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider border border-border">
                            {cat}
                        </span>
                    ))}
                </div>
            </div>

        </div>
    );

    if (href) {
        return (
            <a href={href} className="block w-full h-full no-underline">
                {content}
            </a>
        );
    }

    return content;
}
