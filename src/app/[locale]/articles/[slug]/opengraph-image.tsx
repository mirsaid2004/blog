import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getArticleBySlug } from "@/lib/content/queries";
import { renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const item = await getArticleBySlug(slug, locale);
  const t = await getTranslations({ locale, namespace: "Archive.common" });
  if (!item) return renderOgImage({ title: SITE_NAME });
  return renderOgImage({
    eyebrow: `${t("typeArticle")} · ${t("minRead", { minutes: item.readMinutes })}`,
    title: item.title,
    summary: item.summary,
    tags: item.tags,
  });
}
