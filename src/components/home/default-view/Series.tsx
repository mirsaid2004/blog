import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import SeriesCard from './SeriesCard';
import { RefreshCw, Gift, Percent, ArrowUpRight, Zap, Target, BookOpen, Layers } from 'lucide-react';
import { formatDate } from '@/lib/content/format';
import { getSeries } from '@/lib/content/queries';

const HOME_SERIES_COUNT = 3;

/**
 * Decorative icons and images for the stacked-card animation. Series covers are
 * still placeholders, so these keep the cards looking right until real covers exist.
 */
const DECOR = [
    {
        icons: [RefreshCw, Gift, Percent, ArrowUpRight],
        images: [
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80",
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80",
            "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&q=80",
            "https://images.unsplash.com/photo-1627398248735-0ba6becfc419?w=500&q=80"
        ],
    },
    {
        icons: [Zap, Target, BookOpen, Layers],
        images: [
            "https://images.unsplash.com/photo-1627398248735-0ba6becfc419?w=500&q=80",
            "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&q=80",
            "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?w=500&q=80",
            "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=500&q=80"
        ],
    },
    {
        icons: [Layers, RefreshCw, Zap, Gift],
        images: [
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80"
        ],
    },
];

export default function Series() {
    const locale = useLocale();
    const seriesData = getSeries()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, HOME_SERIES_COUNT)
        .map((series, idx) => {
            const decor = DECOR[idx % DECOR.length];
            return {
                key: series.id,
                title: series.title,
                description: series.summary,
                date: formatDate(series.updatedAt, locale),
                parts: series.parts.length,
                categories: series.tags,
                icons: decor.icons,
                images: decor.images,
                href: `/series/${series.slug}`,
            };
        });

    return (
        <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    Series
                </h2>
                <Link
                    href="/series"
                    className="text-primary text-sm font-medium hover:underline underline-offset-4 decoration-primary/50"
                >
                    View All
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seriesData.map(({ key, ...series }) => (
                    <SeriesCard key={key} {...series} />
                ))}
            </div>
        </section>
    );
}