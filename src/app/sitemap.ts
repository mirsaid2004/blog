import type { MetadataRoute } from "next";
import type { Locale } from "next-intl";
import { routing } from "@/i18n/routing";
import { contentHref } from "@/lib/content/links";
import { getArticles, getPosts, getSeries } from "@/lib/content/queries";
import type { Localized } from "@/lib/content/types";
import { absoluteUrl } from "@/lib/site";

const SITE_PAGES = ["/", "/articles", "/posts", "/series"];

const url = (locale: Locale, path: string) => absoluteUrl(`/${locale}${path === "/" ? "" : path}`);

/** One entry per URL, each listing its sibling languages (and x-default). */
function entries(
  path: string,
  languages: readonly Locale[],
  xDefault: Locale,
  lastModified?: string
): MetadataRoute.Sitemap {
  const alternates = {
    languages: {
      ...Object.fromEntries(languages.map((l) => [l, url(l, path)])),
      "x-default": url(xDefault, path),
    },
  };
  return languages.map((locale) => ({ url: url(locale, path), lastModified, alternates }));
}

/** Only real translations are listed; fallback pages are noindex and stay out. */
function contentEntries(path: string, item: Localized, lastModified: string) {
  const xDefault = item.languages.includes(item.originalLocale) ? item.originalLocale : item.languages[0];
  return entries(path, item.languages, xDefault, lastModified);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Which languages a piece has doesn't depend on the reader's locale.
  const locale = routing.defaultLocale;
  return [
    ...SITE_PAGES.flatMap((path) => entries(path, routing.locales, routing.defaultLocale)),
    ...[...(await getArticles(locale)), ...(await getPosts(locale))].flatMap((item) =>
      contentEntries(contentHref(item), item, item.publishedAt)
    ),
    ...(await getSeries(locale)).flatMap((series) =>
      contentEntries(`/series/${series.slug}`, series, series.updatedAt)
    ),
  ];
}
