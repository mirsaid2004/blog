import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Newspaper } from "lucide-react";
import ArchiveHeader from "@/components/archive/ArchiveHeader";
import ArchiveToolbar from "@/components/archive/ArchiveToolbar";
import ArchiveBackdrop from "@/components/archive/effects/ArchiveBackdrop";
import ArticleCard from "@/components/archive/ArticleCard";
import EmptyState from "@/components/archive/EmptyState";
import Reveal from "@/components/archive/Reveal";
import FeaturedArticle from "@/components/archive/FeaturedArticle";
import { applyFilters, getArticles, hasActiveFilters, parseFilters, tagCounts } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Archive.articles" });
  return { title: t("eyebrow"), description: t("description") };
}

export default async function ArticlesPage({ params, searchParams }: PageProps) {
  const t = await getTranslations("Archive");
  const filters = parseFilters(await searchParams);
  const { locale } = await params;
  const all = getArticles(locale);
  const results = applyFilters(all, filters);

  // Feature the newest article only on the unfiltered view, where "newest" is meaningful.
  const showFeatured = !hasActiveFilters(filters) && results.length > 1;
  const featured = showFeatured ? results[0] : undefined;
  const rest = showFeatured ? results.slice(1) : results;
  const minutes = all.reduce((sum, a) => sum + a.readMinutes, 0);
  const views = all.reduce((sum, a) => sum + a.views, 0);

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <ArchiveBackdrop variant="aurora" />
      {/* Header and toolbar share the posts page width; the content grid stays wider. */}
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <ArchiveHeader
          icon={Newspaper}
          eyebrow={t("articles.eyebrow")}
          title={t("articles.title")}
          description={t("articles.description")}
          stats={[
            { value: all.length, label: t("common.stats.articles", { count: all.length }) },
            { value: minutes, label: t("common.stats.minutes", { count: minutes }) },
            { value: views, label: t("common.stats.views", { count: views }), compact: true },
          ]}
        />

        <Suspense>
          <ArchiveToolbar tags={tagCounts(all)} resultCount={results.length} />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {results.length === 0 ? (
          <EmptyState resetHref="/articles" />
        ) : (
          <>
            {featured && <FeaturedArticle article={featured} />}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((article, i) => (
                <Reveal key={article.id} index={i}>
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
