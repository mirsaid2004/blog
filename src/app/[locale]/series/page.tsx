import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Layers } from "lucide-react";
import ArchiveHeader from "@/components/archive/ArchiveHeader";
import ArchiveToolbar from "@/components/archive/ArchiveToolbar";
import ArchiveBackdrop from "@/components/archive/effects/ArchiveBackdrop";
import EmptyState from "@/components/archive/EmptyState";
import Reveal from "@/components/archive/Reveal";
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

export default async function SeriesPage({ params, searchParams }: PageProps) {
  const t = await getTranslations("Archive");
  const filters = parseFilters(await searchParams);
  const { locale } = await params;
  const all = getSeries(locale);
  // Search also matches the titles of the parts inside each series.
  const results = applyFilters(all, filters, (s) => s.parts.map((p) => p.title).join(" "));
  const totalParts = all.reduce((sum, s) => sum + s.parts.length, 0);
  const minutes = all.reduce((sum, s) => sum + s.readMinutes, 0);

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <ArchiveBackdrop variant="galaxy" />
      {/* Header and toolbar share the posts page width; the content grid stays wider. */}
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <ArchiveHeader
          icon={Layers}
          eyebrow={t("series.eyebrow")}
          title={t("series.title")}
          description={t("series.description")}
          stats={[
            { value: all.length, label: t("common.stats.series", { count: all.length }) },
            { value: totalParts, label: t("common.stats.parts", { count: totalParts }) },
            { value: minutes, label: t("common.stats.minutes", { count: minutes }) },
          ]}
        />

        <Suspense>
          <ArchiveToolbar tags={tagCounts(all)} resultCount={results.length} />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {results.length === 0 ? (
          <EmptyState resetHref="/series" />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {results.map((series, i) => (
              <Reveal key={series.id} index={i}>
                <SeriesCollectionCard series={series} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
