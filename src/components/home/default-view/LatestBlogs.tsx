import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { formatCompact, formatDate } from "@/lib/content/format";
import { contentHref } from "@/lib/content/links";
import EmptyState from "@/components/archive/EmptyState";
import { getArticles, getPosts, searchItems } from "@/lib/content/queries";
import BlogCard from "./BlogCard";

const LATEST_COUNT = 9;
const FALLBACK_COVER = "/series-placeholder.svg";

/** The newest articles and posts, or, with a search query (`?q=`), the best matches. */
export default async function LatestBlogs({ query = "" }: { query?: string }) {
    const locale = await getLocale();
    const [common, t] = await Promise.all([getTranslations("Archive.common"), getTranslations("Home")]);

    const all = [...(await getArticles(locale)), ...(await getPosts(locale))].sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt)
    );
    const searching = query.trim().length > 0;
    const latest = searching ? await searchItems(all, query, locale) : all.slice(0, LATEST_COUNT);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    {searching ? t("resultsFor", { query: query.trim() }) : t("latest")}
                </h2>
                <Link
                    href="/articles"
                    className="text-primary text-sm font-medium hover:underline underline-offset-4 decoration-primary/50"
                >
                    {t("viewAll")}
                </Link>
            </div>
            {searching && latest.length === 0 && <EmptyState resetHref="/" />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latest.map((item) => (
                    <BlogCard
                        key={item.id}
                        href={contentHref(item)}
                        lang={item.locale}
                        languages={item.languages}
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
