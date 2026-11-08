export type ContentType = "article" | "post";

export interface ContentStats {
  views: number;
  rating: number;
  ratingCount: number;
}

/** An article or a post. Articles are long-form with a cover; posts are short and text-first. */
export interface ContentItem extends ContentStats {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  /** ISO date (YYYY-MM-DD) */
  publishedAt: string;
  readMinutes: number;
  tags: string[];
  cover?: string;
}

/** An ordered collection of existing articles and posts (mixed). */
export interface Series extends ContentStats {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  cover?: string;
  /** Ordered ids of articles and posts. */
  items: string[];
}

export interface SeriesWithItems extends Series {
  parts: ContentItem[];
  readMinutes: number;
  updatedAt: string;
}

export type SortKey = "latest" | "popular" | "top";

export const SORT_KEYS: SortKey[] = ["latest", "popular", "top"];

export interface ArchiveFilters {
  q: string;
  tag: string | null;
  sort: SortKey;
}
