import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import ArchiveHeader from "@/components/archive/ArchiveHeader";
import ArchiveToolbar from "@/components/archive/ArchiveToolbar";
import EmptyState from "@/components/archive/EmptyState";
import SeriesCollectionCard from "@/components/archive/SeriesCollectionCard";
import { applyFilters, getSeries, parseFilters, tagCounts } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Archive.series" });
  return { title: t("eyebrow"), description: t("description") };
}

export default async function SeriesPage({ searchParams }: PageProps) {
  const t = await getTranslations("Archive");
  const filters = parseFilters(await searchParams);
  const all = getSeries();
  // Search also matches the titles of the parts inside each series.
  const results = applyFilters(all, filters, (s) => s.parts.map((p) => p.title).join(" "));
  const totalParts = all.reduce((sum, s) => sum + s.parts.length, 0);

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10),transparent_65%)]" />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <ArchiveHeader
          eyebrow={t("series.eyebrow")}
          title={t("series.title")}
          description={t("series.description")}
          stats={[
            { label: t("series.count", { count: all.length }) },
            { label: t("series.parts", { count: totalParts }) },
          ]}
        />

        <Suspense>
          <ArchiveToolbar tags={tagCounts(all)} resultCount={results.length} />
        </Suspense>

        {results.length === 0 ? (
          <EmptyState resetHref="/series" />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {results.map((series) => (
              <SeriesCollectionCard key={series.id} series={series} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
