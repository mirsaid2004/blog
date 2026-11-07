import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import ArchiveHeader from "@/components/archive/ArchiveHeader";
import ArchiveToolbar from "@/components/archive/ArchiveToolbar";
import ArticleCard from "@/components/archive/ArticleCard";
import EmptyState from "@/components/archive/EmptyState";
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

export default async function ArticlesPage({ searchParams }: PageProps) {
  const t = await getTranslations("Archive");
  const filters = parseFilters(await searchParams);
  const all = getArticles();
  const results = applyFilters(all, filters);

  // Feature the newest article only on the unfiltered view, where "newest" is meaningful.
  const showFeatured = !hasActiveFilters(filters) && results.length > 1;
  const featured = showFeatured ? results[0] : undefined;
  const rest = showFeatured ? results.slice(1) : results;

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10),transparent_65%)]" />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <ArchiveHeader
          eyebrow={t("articles.eyebrow")}
          title={t("articles.title")}
          description={t("articles.description")}
          stats={[
            { label: t("articles.count", { count: all.length }) },
            {
              label: t("common.readingTime", {
                minutes: all.reduce((sum, a) => sum + a.readMinutes, 0),
              }),
            },
          ]}
        />

        <Suspense>
          <ArchiveToolbar tags={tagCounts(all)} resultCount={results.length} />
        </Suspense>

        {results.length === 0 ? (
          <EmptyState resetHref="/articles" />
        ) : (
          <>
            {featured && <FeaturedArticle article={featured} />}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
