import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import type { ContentStats } from "./types";

/**
 * Views and ratings per content id, from `content_stats` in Neon. Read on every
 * list, so cached for a few minutes (views tick too often to revalidate on each
 * one); a rating revalidates the tag right away.
 */

export const STATS_TAG = "stats";

const EMPTY: ContentStats = { views: 0, rating: 0, ratingCount: 0 };

async function readStats(): Promise<Record<string, ContentStats>> {
  if (process.env.CONTENT_SOURCE === "local" && !process.env.DATABASE_URL) return {};
  const rows = await db().select().from(schema.contentStats);
  return Object.fromEntries(
    rows.map((r) => [
      r.contentId,
      { views: r.views, ratingCount: r.ratingCount, rating: r.ratingCount ? r.ratingSum / r.ratingCount : 0 },
    ])
  );
}

const cachedStats =
  process.env.NODE_ENV === "development"
    ? cache(readStats)
    : unstable_cache(readStats, ["content-stats"], { tags: [STATS_TAG], revalidate: 300 });

export type StatsLookup = (id: string) => ContentStats;

export async function loadStats(): Promise<StatsLookup> {
  const stats = await cachedStats();
  return (id) => stats[id] ?? EMPTY;
}
