import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { MIN_RATINGS } from "@/lib/content/types";
import { recentComments, type AdminComment } from "@/lib/engagement/comments";

/**
 * Numbers for the admin analytics page. Daily views come from `view_event`,
 * which keeps 90 days; all-time totals come from `content_stats`.
 */

export const WINDOW_DAYS = 30;

export type PieceRef = {
  id: string;
  kind: "article" | "post" | "series";
  slug: string;
  title: string;
};

export interface Analytics {
  totals: { views: number; viewsWindow: number; ratings: number; averageRating: number | null; comments: number; readers: number };
  daily: { day: string; views: number }[];
  byLocale: { locale: string; views: number }[];
  topViewed: (PieceRef & { views: number })[];
  topRated: (PieceRef & { average: number; count: number })[];
  comments: (AdminComment & { piece: PieceRef | null })[];
}

const rows = async <T extends Record<string, unknown>>(query: ReturnType<typeof sql>) =>
  (await db().execute<T>(query)).rows;

/** Title in the piece's original language. */
const pieceColumns = sql`i.id, i.kind, i.slug,
  coalesce((select t.title from content_translations t where t.item_id = i.id and t.locale = i.original_locale), i.slug) as title`;

export async function loadAnalytics(): Promise<Analytics> {
  const since = sql`current_date - ${WINDOW_DAYS - 1}::int`;

  const [[totals], daily, byLocale, topViewed, topRated, comments] = await Promise.all([
    rows<{ views: number; ratings: number; rating_sum: number; comments: number; readers: number; views_window: number }>(sql`
      select coalesce((select sum(views) from content_stats), 0)::int as views,
             coalesce((select sum(rating_count) from content_stats), 0)::int as ratings,
             coalesce((select sum(rating_sum) from content_stats), 0)::int as rating_sum,
             (select count(*) from comment where hidden_at is null)::int as comments,
             (select count(*) from "user")::int as readers,
             (select count(*) from view_event where day >= ${since})::int as views_window`),
    rows<{ day: string; views: number }>(sql`
      select to_char(d, 'YYYY-MM-DD') as day, coalesce(v.views, 0)::int as views
      from generate_series(${since}, current_date, interval '1 day') d
      left join (select day, count(*) as views from view_event where day >= ${since} group by day) v on v.day = d::date
      order by d`),
    rows<{ locale: string; views: number }>(sql`
      select locale, count(*)::int as views from view_event where day >= ${since} group by locale order by views desc`),
    rows<PieceRef & { views: number }>(sql`
      select ${pieceColumns}, v.views::int as views
      from (select content_id, count(*) as views from view_event where day >= ${since} group by content_id) v
      join content_items i on i.id = v.content_id
      order by v.views desc limit 10`),
    rows<PieceRef & { average: number; count: number }>(sql`
      select ${pieceColumns}, round(s.rating_sum::numeric / s.rating_count, 2)::float as average, s.rating_count as count
      from content_stats s join content_items i on i.id = s.content_id
      where s.rating_count >= ${MIN_RATINGS}
      order by s.rating_sum::float / s.rating_count desc, s.rating_count desc limit 10`),
    recentComments(30),
  ]);

  const ids = [...new Set(comments.map((c) => c.contentId))];
  const pieces = ids.length
    ? await rows<PieceRef>(sql`select ${pieceColumns} from content_items i where i.id in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`)
    : [];
  const byId = new Map(pieces.map((p) => [p.id, p]));

  return {
    totals: {
      views: totals.views,
      viewsWindow: totals.views_window,
      ratings: totals.ratings,
      averageRating: totals.ratings ? totals.rating_sum / totals.ratings : null,
      comments: totals.comments,
      readers: totals.readers,
    },
    daily,
    byLocale,
    topViewed,
    topRated,
    comments: comments.map((c) => ({ ...c, piece: byId.get(c.contentId) ?? null })),
  };
}
