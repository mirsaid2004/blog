import { sql } from "drizzle-orm";
import type { Locale } from "next-intl";
import { db, schema } from "@/lib/db";

/**
 * Full-text search over published translations (title, summary and body),
 * using the generated `search` tsvector on content_translations.
 *
 * Each word becomes a prefix term (`cach:*`), so results update while typing
 * (single letters match exactly),
 * and is stemmed with the row's own language config (english / russian /
 * simple), so "caches" also finds "caching". A match in the reader's language
 * ranks above the same match in another language.
 *
 * Returns content id → relevance, or null when search isn't available (local
 * content source), in which case callers fall back to substring matching.
 */

const MAX_TERMS = 8;
const READER_LOCALE_BOOST = 1.5;

function toPrefixQuery(query: string): string | null {
  const terms = query.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.slice(0, MAX_TERMS);
  // A single letter as a prefix would match nearly everything, so it must match exactly.
  return terms?.length ? terms.map((term) => (term.length > 1 ? `${term}:*` : term)).join(" & ") : null;
}

export async function searchContent(query: string, locale: Locale): Promise<Map<string, number> | null> {
  if (process.env.CONTENT_SOURCE === "local") return null;
  const tsquery = toPrefixQuery(query);
  if (!tsquery) return new Map();

  const t = schema.contentTranslations;
  const config = schema.searchConfig(t.locale);
  const rows = await db()
    .select({
      id: t.itemId,
      score: sql<number>`max(ts_rank(${t.search}, to_tsquery(${config}, ${tsquery})) * case when ${t.locale} = ${locale} then ${READER_LOCALE_BOOST}::real else 1 end)`.mapWith(Number),
    })
    .from(t)
    .where(sql`${t.status} = 'published' and ${t.search} @@ to_tsquery(${config}, ${tsquery})`)
    .groupBy(t.itemId);
  return new Map(rows.map((row) => [row.id, row.score]));
}
