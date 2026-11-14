import type { Locale } from "next-intl";

export type ContentType = "article" | "post";

export type TranslationStatus = "draft" | "published";

export interface ContentStats {
  views: number;
  rating: number;
  ratingCount: number;
}

/** Which language a piece is shown in, resolved for the reader's locale. */
export interface Localized {
  /** Language of the title, summary and body. Differs from the reader's locale on a fallback. */
  locale: Locale;
  /** Languages with a published translation. */
  languages: Locale[];
  /** Languages whose translation exists but is still a draft ("coming soon"). */
  upcoming: Locale[];
}

/** An article or a post. Articles are long-form with a cover; posts are short and text-first. */
export interface ContentItem extends ContentStats, Localized {
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
export interface Series extends ContentStats, Localized {
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
