import { ARTICLES, POSTS, SERIES } from "./data";
import {
  SORT_KEYS,
  type ArchiveFilters,
  type ContentItem,
  type ContentStats,
  type SeriesWithItems,
  type SortKey,
} from "./types";

const BY_ID = new Map<string, ContentItem>(
  [...ARTICLES, ...POSTS].map((item) => [item.id, item])
);

export function getArticles(): ContentItem[] {
  return ARTICLES;
}

export function getArticleBySlug(slug: string): ContentItem | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

export function getPosts(): ContentItem[] {
  return POSTS;
}

export function getPostBySlug(slug: string): ContentItem | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function getSeries(): SeriesWithItems[] {
  return SERIES.map((series) => {
    const parts = series.items
      .map((id) => BY_ID.get(id))
      .filter((item): item is ContentItem => Boolean(item));
    return {
      ...series,
      parts,
      readMinutes: parts.reduce((sum, part) => sum + part.readMinutes, 0),
      updatedAt: parts.reduce(
        (latest, part) => (part.publishedAt > latest ? part.publishedAt : latest),
        series.publishedAt
      ),
    };
  });
}

export function getSeriesBySlug(slug: string): SeriesWithItems | undefined {
  return getSeries().find((series) => series.slug === slug);
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
export function getSeriesContext(itemId: string, seriesSlug: string | undefined): SeriesContext | null {
  if (!seriesSlug) return null;
  const series = getSeriesBySlug(seriesSlug);
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
