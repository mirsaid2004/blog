import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

// Default preview for every page in this locale without its own image (home, lists).
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Footer" });
  return renderOgImage({ title: SITE_NAME, summary: t("brandDescription") });
}
