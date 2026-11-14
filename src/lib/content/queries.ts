import type { Locale } from "next-intl";
import { routing } from "@/i18n/routing";
import { loadContent, type PieceSource, type SeriesSource } from "./source";
import { getStats } from "./stats";
import {
  SORT_KEYS,
  type ArchiveFilters,
  type ContentItem,
  type ContentStats,
  type Localized,
  type SeriesWithItems,
  type SortKey,
} from "./types";

const newestFirst = (a: { publishedAt: string }, b: { publishedAt: string }) =>
  b.publishedAt.localeCompare(a.publishedAt);

/**
 * Pick the language to show: the reader's if published, else the original, else
 * any published one. Null when nothing is published (a draft-only piece).
 */
function localize(source: PieceSource | SeriesSource, locale: Locale) {
  const { translations, meta } = source;
  const languages = routing.locales.filter((l) => translations[l]?.status === "published");
  if (languages.length === 0) return null;
  const shown = languages.includes(locale)
    ? locale
    : languages.includes(meta.originalLocale)
      ? meta.originalLocale
      : languages[0];
  const localized: Localized = {
    locale: shown,
    languages,
    upcoming: routing.locales.filter((l) => translations[l]?.status === "draft"),
  };
  return { localized, translation: translations[shown]! };
}

function toItem(source: PieceSource, locale: Locale): ContentItem | null {
  const resolved = localize(source, locale);
  if (!resolved) return null;
  const { meta } = source;
  return {
    id: meta.id,
    type: source.type,
    slug: source.slug,
    title: resolved.translation.title,
    summary: resolved.translation.summary,
    publishedAt: meta.publishedAt,
    readMinutes: resolved.translation.readMinutes,
    tags: meta.tags,
    cover: meta.cover,
    ...resolved.localized,
    ...getStats(meta.id),
  };
}

/** Every published article and post, newest first, in the reader's language where possible. */
function getItems(locale: Locale): ContentItem[] {
  return loadContent()
    .pieces.map((piece) => toItem(piece, locale))
    .filter((item): item is ContentItem => item !== null)
    .sort(newestFirst);
}

export function getArticles(locale: Locale): ContentItem[] {
  return getItems(locale).filter((item) => item.type === "article");
}

export function getArticleBySlug(slug: string, locale: Locale): ContentItem | undefined {
  return getArticles(locale).find((article) => article.slug === slug);
}

export function getPosts(locale: Locale): ContentItem[] {
  return getItems(locale).filter((item) => item.type === "post");
}

export function getPostBySlug(slug: string, locale: Locale): ContentItem | undefined {
  return getPosts(locale).find((post) => post.slug === slug);
}

/**
 * Published series with their published parts in reading order. Draft or unknown
 * parts are skipped; a series with no published parts is hidden.
 */
export function getSeries(locale: Locale): SeriesWithItems[] {
  const byId = new Map(getItems(locale).map((item) => [item.id, item]));
  return loadContent()
    .series.flatMap((source): SeriesWithItems[] => {
      const resolved = localize(source, locale);
      const parts = source.meta.items
        .map((id) => byId.get(id))
        .filter((item): item is ContentItem => Boolean(item));
      if (!resolved || parts.length === 0) return [];
      const { meta } = source;
      return [
        {
          id: meta.id,
          slug: source.slug,
          title: resolved.translation.title,
          summary: resolved.translation.summary,
          publishedAt: meta.publishedAt,
          tags: meta.tags,
          cover: meta.cover,
          items: meta.items,
          ...resolved.localized,
          ...getStats(meta.id),
          parts,
          readMinutes: parts.reduce((sum, part) => sum + part.readMinutes, 0),
          updatedAt: parts.reduce(
            (latest, part) => (part.publishedAt > latest ? part.publishedAt : latest),
            meta.publishedAt
          ),
        },
      ];
    })
    .sort(newestFirst);
}

export function getSeriesBySlug(slug: string, locale: Locale): SeriesWithItems | undefined {
  return getSeries(locale).find((series) => series.slug === slug);
}

export interface SeriesContext {
  series: SeriesWithItems;
  /** Zero-based position of the item in the series. */
  index: number;
  prev: ContentItem | null;
  next: ContentItem | null;
}

/**
 * Where an item sits in the series it was opened from (`?series=<slug>`).
 * Null when the slug is missing, unknown, or the series doesn't include the item.
 */
export function getSeriesContext(
  itemId: string,
  seriesSlug: string | undefined,
  locale: Locale
): SeriesContext | null {
  if (!seriesSlug) return null;
  const series = getSeriesBySlug(seriesSlug, locale);
  const index = series?.parts.findIndex((part) => part.id === itemId) ?? -1;
  if (!series || index === -1) return null;
  return {
    series,
    index,
    prev: series.parts[index - 1] ?? null,
    next: series.parts[index + 1] ?? null,
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFilters(params: SearchParams): ArchiveFilters {
  const sort = firstParam(params.sort);
  const tag = firstParam(params.tag)?.trim().toLowerCase();
  return {
    q: firstParam(params.q)?.trim() ?? "",
    tag: tag || null,
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "latest",
  };
}

interface Filterable extends ContentStats {
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string;
}

export function applyFilters<T extends Filterable>(
  items: T[],
  { q, tag, sort }: ArchiveFilters,
  /** Extra text to match the query against, e.g. a series' part titles. */
  extraText: (item: T) => string = () => ""
): T[] {
  const needle = q.toLowerCase();
  const filtered = items.filter((item) => {
    if (tag && !item.tags.includes(tag)) return false;
    if (!needle) return true;
    const haystack = [item.title, item.summary, item.tags.join(" "), extraText(item)]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  const sorters: Record<SortKey, (a: T, b: T) => number> = {
    latest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
    popular: (a, b) => b.views - a.views,
    top: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
  };
  return [...filtered].sort(sorters[sort]);
}

/** Tags with how many items use them, most used first. */
export function tagCounts(items: { tags: string[] }[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function hasActiveFilters({ q, tag, sort }: ArchiveFilters): boolean {
  return Boolean(q || tag || sort !== "latest");
}
