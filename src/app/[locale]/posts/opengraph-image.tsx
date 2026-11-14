import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

// This page sets its own openGraph, which drops the image inherited from [locale].
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Archive.posts" });
  return renderOgImage({ title: t("eyebrow"), summary: t("description") });
}
