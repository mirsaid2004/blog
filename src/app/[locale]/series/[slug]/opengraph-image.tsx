import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getSeriesBySlug } from "@/lib/content/queries";
import { renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const series = await getSeriesBySlug(slug, locale);
  const t = await getTranslations({ locale, namespace: "Archive" });
  if (!series) return renderOgImage({ title: SITE_NAME });
  return renderOgImage({
    eyebrow: `${t("series.parts", { count: series.parts.length })} · ${t("common.readingTime", { minutes: series.readMinutes })}`,
    title: series.title,
    summary: series.summary,
    tags: series.tags,
  });
}
