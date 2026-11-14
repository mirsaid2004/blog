import { getLocale, getTranslations } from "next-intl/server";
import { formatCompact, formatDate } from "@/lib/content/format";
import { contentHref } from "@/lib/content/links";
import { getTopPicks } from "@/lib/content/queries";
import TopPicksList from "./TopPicksList";

const FALLBACK_COVER = "/series-placeholder.svg";

/** The three best pieces by weighted rating and views (see getTopPicks). */
export default async function TopPicks() {
    const locale = await getLocale();
    const [t, common, picks] = await Promise.all([
        getTranslations("Home"),
        getTranslations("Archive.common"),
        getTopPicks(locale),
    ]);
    const typeLabel = { article: common("typeArticle"), post: common("typePost"), series: t("series") };

    return (
        <TopPicksList
            title={t("topPicks")}
            picks={picks.map((pick) => ({
                href: pick.kind === "series" ? `/series/${pick.slug}` : contentHref(pick),
                lang: pick.locale,
                title: pick.title,
                date: formatDate(pick.kind === "series" ? pick.updatedAt : pick.publishedAt, locale),
                rating: pick.rating,
                reviews: pick.ratingCount,
                views: formatCompact(pick.views, locale),
                type: typeLabel[pick.kind],
                readTime: common("minRead", { minutes: pick.readMinutes }),
                categories: pick.tags.slice(0, 2),
                image: pick.cover ?? FALLBACK_COVER,
            }))}
        />
    );
}
