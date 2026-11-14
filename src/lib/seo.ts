import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { routing } from "@/i18n/routing";
import type { Localized } from "@/lib/content/types";
import { SITE_NAME } from "@/lib/site";

/**
 * Per-page metadata for search engines and link previews. Every page sets its
 * own `alternates`: Next replaces the object rather than merging it, so a page
 * without one would inherit another page's canonical URL.
 */

/** Open Graph wants language_TERRITORY ("en_US"), not a bare language code. */
const OG_LOCALES: Record<Locale, string> = { en: "en_US", ru: "ru_RU", uz: "uz_UZ" };
export const ogLocale = (locale: Locale) => OG_LOCALES[locale];

const localized = (locale: Locale, path: string) => `/${locale}${path === "/" ? "" : path}`;

const rssLink = (locale: Locale) => ({ "application/rss+xml": `/${locale}/rss.xml` });

interface SitePageInput {
  locale: Locale;
  /** Path without the locale, e.g. `/articles`, or `/` for home. */
  path: string;
  /** Omit on the home page to keep the layout's default title. */
  title?: string;
  description?: string;
}

/**
 * A page that exists in every language: home and the archive lists. Query
 * strings (filters) are left out, so filtered views share the list's canonical.
 */
export function sitePageMetadata({ locale, path, title, description }: SitePageInput): Metadata {
  const url = localized(locale, path);
  return {
    ...(title && { title }),
    ...(description && { description }),
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, localized(l, path)])),
        "x-default": localized(routing.defaultLocale, path),
      },
      types: rssLink(locale),
    },
    // A page's openGraph replaces the layout's, so restate title and description.
    openGraph: { type: "website", siteName: SITE_NAME, locale: ogLocale(locale), url, title, description },
  };
}

interface ContentPageInput {
  /** The reader's locale (the URL's). */
  locale: Locale;
  /** Path without the locale, e.g. `/posts/vim-commands`. */
  path: string;
  item: Localized & { title: string; summary: string; publishedAt: string; tags: string[] };
  ogType: "article" | "website";
}

/**
 * An article, post or series. Only published translations are alternates. A
 * fallback page (reader's language missing) shows another language's text, so
 * it points its canonical at that version and stays out of the index.
 */
export function contentPageMetadata({ locale, path, item, ogType }: ContentPageInput): Metadata {
  const isFallback = item.locale !== locale;
  const canonical = localized(item.locale, path);
  const xDefault = item.languages.includes(item.originalLocale) ? item.originalLocale : item.locale;

  return {
    title: item.title,
    description: item.summary,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(item.languages.map((l) => [l, localized(l, path)])),
        "x-default": localized(xDefault, path),
      },
      types: rssLink(locale),
    },
    robots: isFallback ? { index: false, follow: true } : undefined,
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      title: item.title,
      description: item.summary,
      locale: ogLocale(item.locale),
      alternateLocale: item.languages.filter((l) => l !== item.locale).map(ogLocale),
      url: canonical,
      ...(ogType === "article" && { publishedTime: item.publishedAt, tags: item.tags }),
    },
  };
}
