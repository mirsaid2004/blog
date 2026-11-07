import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import ArchiveHeader from "@/components/archive/ArchiveHeader";
import ArchiveToolbar from "@/components/archive/ArchiveToolbar";
import EmptyState from "@/components/archive/EmptyState";
import PostList from "@/components/archive/PostList";
import { applyFilters, getPosts, parseFilters, tagCounts } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Archive.posts" });
  return { title: t("eyebrow"), description: t("description") };
}

export default async function PostsPage({ searchParams }: PageProps) {
  const t = await getTranslations("Archive");
  const filters = parseFilters(await searchParams);
  const all = getPosts();
  const results = applyFilters(all, filters);

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10),transparent_65%)]" />
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <ArchiveHeader
          eyebrow={t("posts.eyebrow")}
          title={t("posts.title")}
          description={t("posts.description")}
          stats={[
            { label: t("posts.count", { count: all.length }) },
            {
              label: t("common.readingTime", {
                minutes: all.reduce((sum, p) => sum + p.readMinutes, 0),
              }),
            },
          ]}
        />

        <Suspense>
          <ArchiveToolbar tags={tagCounts(all)} resultCount={results.length} />
        </Suspense>

        {results.length === 0 ? (
          <EmptyState resetHref="/posts" />
        ) : (
          <PostList posts={results} groupByMonth={filters.sort === "latest"} />
        )}
      </div>
    </main>
  );
}
