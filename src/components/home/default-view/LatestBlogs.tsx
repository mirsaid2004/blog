import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatCompact, formatDate } from "@/lib/content/format";
import { contentHref } from "@/lib/content/links";
import { getArticles, getPosts } from "@/lib/content/queries";
import BlogCard from "./BlogCard";

const LATEST_COUNT = 9;
const FALLBACK_COVER = "/series-placeholder.svg";

export default function LatestBlogs() {
    const locale = useLocale();
    const common = useTranslations("Archive.common");

    const latest = [...getArticles(locale), ...getPosts(locale)]
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, LATEST_COUNT);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    Latest Blogs
                </h2>
                <Link
                    href="/articles"
                    className="text-primary text-sm font-medium hover:underline underline-offset-4 decoration-primary/50"
                >
                    View All
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latest.map((item) => (
                    <BlogCard
                        key={item.id}
                        href={contentHref(item)}
                        title={item.title}
                        description={item.summary}
                        date={formatDate(item.publishedAt, locale)}
                        image={item.cover ?? FALLBACK_COVER}
                        type={item.type === "article" ? common("typeArticle") : common("typePost")}
                        readTime={common("minRead", { minutes: item.readMinutes })}
                        categories={item.tags}
                        rating={item.rating}
                        reviews={item.ratingCount}
                        views={formatCompact(item.views, locale)}
                    />
                ))}
            </div>
        </div>
    );
}
