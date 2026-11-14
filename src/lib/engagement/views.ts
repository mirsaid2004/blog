import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * View counting (PLAN.md 2.6). A view is counted once per piece, visitor and
 * UTC day. The visitor is an HMAC of IP and user agent keyed with the server
 * secret and the day: raw IPs are never stored, and the same visitor can't be
 * linked across days.
 */

const BOT = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|curl|wget|python|httpclient|axios|node-fetch|go-http/i;
const RETENTION_DAYS = 90;

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function visitorHash(ip: string, userAgent: string, day: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`${day}\n${ip}\n${userAgent}`).digest("base64url").slice(0, 22);
}

/**
 * Record a view; returns whether it counted (false for a repeat visit today or
 * an unknown id). One statement: the event insert and the counter bump share a
 * transaction, and the counter only moves when the event is new.
 */
export async function recordView(contentId: string, locale: string, hash: string, day: string): Promise<boolean> {
  const { viewEvent, contentStats, contentItems } = schema;
  const result = await db().execute(sql`
    with inserted as (
      insert into ${viewEvent} (content_id, visitor_hash, day, locale)
      select ${contentId}, ${hash}, ${day}::date, ${locale}
      where exists (select 1 from ${contentItems} where id = ${contentId})
      on conflict do nothing
      returning content_id
    )
    insert into ${contentStats} (content_id, views)
    select content_id, 1 from inserted
    on conflict (content_id) do update set views = ${contentStats}.views + 1
    returning content_id
  `);
  return result.rows.length > 0;
}

/** Delete view events past the retention window; the totals in content_stats stay. */
export async function pruneViewEvents(): Promise<number> {
  const result = await db().execute(
    sql`delete from ${schema.viewEvent} where day < (current_date - ${RETENTION_DAYS}::int)`
  );
  return result.rowCount ?? 0;
}
