import type { Locale } from "next-intl";
import { routing } from "@/i18n/routing";
import { assetUrl } from "@/lib/assets";
import { searchContent } from "./search";
import { loadContent, type PieceSource, type SeriesSource } from "./source";
import { loadStats, type StatsLookup } from "./stats";
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
    originalLocale: meta.originalLocale,
  };
  return { localized, translation: translations[shown]! };
}

function toItem(source: PieceSource, locale: Locale, getStats: StatsLookup): ContentItem | null {
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
    cover: assetUrl(meta.cover),
    ...resolved.localized,
    ...getStats(meta.id),
  };
}

/** Every published article and post, newest first, in the reader's language where possible. */
async function getItems(locale: Locale): Promise<ContentItem[]> {
  const [content, getStats] = await Promise.all([loadContent(), loadStats()]);
  return content.pieces
    .map((piece) => toItem(piece, locale, getStats))
    .filter((item): item is ContentItem => item !== null)
    .sort(newestFirst);
}

export async function getArticles(locale: Locale): Promise<ContentItem[]> {
  return (await getItems(locale)).filter((item) => item.type === "article");
}

export async function getArticleBySlug(slug: string, locale: Locale): Promise<ContentItem | undefined> {
  return (await getArticles(locale)).find((article) => article.slug === slug);
}

export async function getPosts(locale: Locale): Promise<ContentItem[]> {
  return (await getItems(locale)).filter((item) => item.type === "post");
}

export async function getPostBySlug(slug: string, locale: Locale): Promise<ContentItem | undefined> {
  return (await getPosts(locale)).find((post) => post.slug === slug);
}

/**
 * Published series with their published parts in reading order. Draft or unknown
 * parts are skipped; a series with no published parts is hidden.
 */
export async function getSeries(locale: Locale): Promise<SeriesWithItems[]> {
  const [items, content, getStats] = await Promise.all([getItems(locale), loadContent(), loadStats()]);
  const byId = new Map(items.map((item) => [item.id, item]));
  return content.series
    .flatMap((source): SeriesWithItems[] => {
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
          cover: assetUrl(meta.cover),
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

export async function getSeriesBySlug(slug: string, locale: Locale): Promise<SeriesWithItems | undefined> {
  return (await getSeries(locale)).find((series) => series.slug === slug);
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
export async function getSeriesContext(
  itemId: string,
  seriesSlug: string | undefined,
  locale: Locale
): Promise<SeriesContext | null> {
  if (!seriesSlug) return null;
  const series = await getSeriesBySlug(seriesSlug, locale);
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
  id: string;
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string;
}

interface FilterOptions<T> {
  /** Ids that also make the item match, e.g. a series' parts. */
  relatedIds?: (item: T) => string[];
  /** Extra text for the substring fallback, e.g. a series' part titles. */
  extraText?: (item: T) => string;
}

/**
 * Tag filter, search and sort for the archive lists. Search uses Postgres
 * full-text search over title, summary and body (see search.ts); a tag that
 * contains the query also matches. Without the database (CONTENT_SOURCE=local)
 * or if the search query fails, it falls back to substring matching.
 */
export async function filterItems<T extends Filterable>(
  items: T[],
  { q, tag, sort }: ArchiveFilters,
  locale: Locale,
  { relatedIds = () => [], extraText = () => "" }: FilterOptions<T> = {}
): Promise<T[]> {
  const needle = q.toLowerCase();
  let hits: Map<string, number> | null = null;
  if (needle) {
    try {
      hits = await searchContent(q, locale);
    } catch (error) {
      console.error("search failed, falling back to substring matching", error);
    }
  }

  const matches = (item: T) => {
    if (!needle) return true;
    if (item.tags.some((t) => t.includes(needle))) return true;
    if (hits) return hits.has(item.id) || relatedIds(item).some((id) => hits.has(id));
    return [item.title, item.summary, extraText(item)].join(" ").toLowerCase().includes(needle);
  };
  const filtered = items.filter((item) => (!tag || item.tags.includes(tag)) && matches(item));

  const sorters: Record<SortKey, (a: T, b: T) => number> = {
    latest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
    popular: (a, b) => b.views - a.views,
    top: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
  };
  return [...filtered].sort(sorters[sort]);
}

/**
 * Articles and posts matching a free-text query, most relevant first (the home
 * page search). Same matching as filterItems, ordered by search rank.
 */
export async function searchItems(items: ContentItem[], q: string, locale: Locale): Promise<ContentItem[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  let hits: Map<string, number> | null = null;
  try {
    hits = await searchContent(needle, locale);
  } catch (error) {
    console.error("search failed, falling back to substring matching", error);
  }
  const tagHit = (item: ContentItem) => item.tags.some((t) => t.includes(needle));
  if (!hits) {
    return items.filter(
      (item) => tagHit(item) || `${item.title} ${item.summary}`.toLowerCase().includes(needle)
    );
  }
  const score = (item: ContentItem) => (hits.get(item.id) ?? 0) + (tagHit(item) ? 0.5 : 0);
  return items
    .filter((item) => hits.has(item.id) || tagHit(item))
    .sort((a, b) => score(b) - score(a) || b.publishedAt.localeCompare(a.publishedAt));
}

export type TopPick = (ContentItem & { kind: "article" | "post" }) | (SeriesWithItems & { kind: "series" });

/** Prior for the weighted rating: a piece starts as if it had PRIOR_COUNT ratings of PRIOR_MEAN. */
const PRIOR_MEAN = 3.5;
const PRIOR_COUNT = 5;

/**
 * Best pieces by real data: a Bayesian-weighted rating (a few 5-star ratings
 * don't beat many 4.8s) scaled by log views. Ties, e.g. before any data
 * exists, go to the newest piece.
 */
export async function getTopPicks(locale: Locale, count = 3): Promise<TopPick[]> {
  const [items, series] = await Promise.all([getItems(locale), getSeries(locale)]);
  const all: TopPick[] = [
    ...items.map((item) => ({ ...item, kind: item.type })),
    ...series.map((s) => ({ ...s, kind: "series" as const })),
  ];
  const score = (p: TopPick) =>
    ((PRIOR_MEAN * PRIOR_COUNT + p.rating * p.ratingCount) / (PRIOR_COUNT + p.ratingCount)) * Math.log10(10 + p.views);
  return all.sort((a, b) => score(b) - score(a) || b.publishedAt.localeCompare(a.publishedAt)).slice(0, count);
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
