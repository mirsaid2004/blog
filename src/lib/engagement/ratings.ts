import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** The reader's own rating of a piece (1–5), or null. */
export async function getUserRating(userId: string, contentId: string): Promise<number | null> {
  const [row] = await db()
    .select({ value: schema.rating.value })
    .from(schema.rating)
    .where(and(eq(schema.rating.userId, userId), eq(schema.rating.contentId, contentId)))
    .limit(1);
  return row?.value ?? null;
}

/**
 * Set (1–5) or clear (null) a reader's rating, then recompute the piece's
 * rating totals from the ratings table. Both run in one transaction, so the
 * totals always match the rows.
 *
 * Deleting a user cascades to their ratings without recomputing totals; if
 * account deletion is ever added, recompute the affected pieces there too.
 */
export async function setUserRating(userId: string, contentId: string, value: number | null) {
  const { rating, contentStats } = schema;
  const database = db();
  const write =
    value === null
      ? database.delete(rating).where(and(eq(rating.userId, userId), eq(rating.contentId, contentId)))
      : database
          .insert(rating)
          .values({ userId, contentId, value })
          .onConflictDoUpdate({ target: [rating.userId, rating.contentId], set: { value, updatedAt: sql`now()` } });
  const recompute = database.execute(sql`
    insert into ${contentStats} (content_id, rating_sum, rating_count)
    select ${contentId}, coalesce(sum(value), 0), count(*) from ${rating} where content_id = ${contentId}
    on conflict (content_id) do update
      set rating_sum = excluded.rating_sum, rating_count = excluded.rating_count
  `);
  await database.batch([write, recompute]);
}

export async function contentExists(contentId: string): Promise<boolean> {
  const [row] = await db()
    .select({ id: schema.contentItems.id })
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, contentId))
    .limit(1);
  return Boolean(row);
}
