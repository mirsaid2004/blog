import type { ContentItem } from "./types";

/** Detail page of an article or post, optionally opened as part of a series. */
export function contentHref(item: ContentItem, seriesSlug?: string) {
  const base = `${item.type === "article" ? "/articles" : "/posts"}/${item.slug}`;
  return seriesSlug ? `${base}?series=${seriesSlug}` : base;
}
