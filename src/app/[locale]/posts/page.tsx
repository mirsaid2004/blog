import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { NotebookPen } from "lucide-react";
import ArchiveHeader from "@/components/archive/ArchiveHeader";
import ArchiveToolbar from "@/components/archive/ArchiveToolbar";
import ArchiveBackdrop from "@/components/archive/effects/ArchiveBackdrop";
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
  const minutes = all.reduce((sum, p) => sum + p.readMinutes, 0);
  const views = all.reduce((sum, p) => sum + p.views, 0);

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <ArchiveBackdrop variant="threads" />
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <ArchiveHeader
          icon={NotebookPen}
          eyebrow={t("posts.eyebrow")}
          title={t("posts.title")}
          description={t("posts.description")}
          stats={[
            { value: all.length, label: t("common.stats.posts", { count: all.length }) },
            { value: minutes, label: t("common.stats.minutes", { count: minutes }) },
            { value: views, label: t("common.stats.views", { count: views }), compact: true },
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
