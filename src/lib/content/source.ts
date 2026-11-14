import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import type { Locale } from "next-intl";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import {
  formatIssues,
  isContentPath,
  parseContent,
  type ContentStore as FullStore,
  type PieceSource as FullPiece,
  type SeriesSource as FullSeries,
  type Translation,
} from "./parse";
import type { ContentType } from "./types";

/**
 * Where pages read content from:
 *
 * - `database` (default): the content index in Neon, filled from the GitHub
 *   content repo by the webhook and `npm run content:sync`.
 * - `local` (CONTENT_SOURCE=local): a checkout of the content repo at
 *   CONTENT_DIR, parsed on each request. For working offline.
 *
 * Lists use the store without bodies; a body is loaded only for its own page.
 * Everything is cached under the `content` tag, which a sync revalidates.
 */

export const CONTENT_TAG = "content";

/** A translation's metadata, without the MDX body. */
export type TranslationMeta = Omit<Translation, "body">;
export type PieceSource = FullPiece<TranslationMeta>;
export type SeriesSource = FullSeries<TranslationMeta>;
export type ContentStore = FullStore<TranslationMeta>;

const isLocal = () => process.env.CONTENT_SOURCE === "local";
const isDev = process.env.NODE_ENV === "development";

// --- local ---------------------------------------------------------------------

// Only used with CONTENT_SOURCE=local, so the paths are excluded from output
// tracing (otherwise Turbopack would bundle the whole project into the server).
function readLocalFiles(): Map<string, string> {
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.CONTENT_DIR ?? "../blog-db");
  if (!fs.existsSync(/*turbopackIgnore: true*/ root)) throw new Error(`CONTENT_DIR not found: ${root}`);
  const files = new Map<string, string>();
  for (const entry of fs.readdirSync(/*turbopackIgnore: true*/ root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = path.join(/*turbopackIgnore: true*/ entry.parentPath, entry.name);
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (isContentPath(rel)) files.set(rel, fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8"));
  }
  return files;
}

const loadLocal = cache((): FullStore => {
  const { store, errors, warnings } = parseContent(readLocalFiles());
  if (warnings.length) console.warn(formatIssues(warnings));
  if (errors.length) throw new Error(`Invalid content:\n${formatIssues(errors)}`);
  return store;
});

function withoutBody({ body, ...meta }: Translation): TranslationMeta {
  void body;
  return meta;
}

function stripBodies(store: FullStore): ContentStore {
  const strip = <T extends { translations: Partial<Record<Locale, Translation>> }>(source: T) => ({
    ...source,
    translations: Object.fromEntries(Object.entries(source.translations).map(([l, t]) => [l, withoutBody(t!)])),
  });
  return { pieces: store.pieces.map(strip), series: store.series.map(strip) };
}

// --- database ------------------------------------------------------------------

async function readIndex(): Promise<ContentStore> {
  const { contentItems, contentTranslations } = schema;
  const [items, translations] = await Promise.all([
    db().select().from(contentItems),
    db()
      .select({
        itemId: contentTranslations.itemId,
        locale: contentTranslations.locale,
        title: contentTranslations.title,
        summary: contentTranslations.summary,
        status: contentTranslations.status,
        readMinutes: contentTranslations.readMinutes,
      })
      .from(contentTranslations),
  ]);

  const byItem = new Map<string, Partial<Record<Locale, TranslationMeta>>>();
  for (const { itemId, locale, ...t } of translations) {
    const entry = byItem.get(itemId) ?? {};
    entry[locale as Locale] = t;
    byItem.set(itemId, entry);
  }

  const store: ContentStore = { pieces: [], series: [] };
  for (const item of items.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const base = {
      id: item.id,
      originalLocale: item.originalLocale as Locale,
      publishedAt: item.publishedAt,
      tags: item.tags,
      ...(item.cover ? { cover: item.cover } : {}),
    };
    const translationsOf = byItem.get(item.id) ?? {};
    if (item.kind === "series") {
      store.series.push({ slug: item.slug, meta: { ...base, items: item.seriesItems ?? [] }, translations: translationsOf });
    } else {
      store.pieces.push({ type: item.kind, slug: item.slug, meta: base, translations: translationsOf });
    }
  }
  return store;
}

async function readBody(type: ContentType, slug: string, locale: Locale): Promise<string | null> {
  const { contentItems, contentTranslations } = schema;
  const [row] = await db()
    .select({ body: contentTranslations.body })
    .from(contentTranslations)
    .innerJoin(contentItems, eq(contentItems.id, contentTranslations.itemId))
    .where(and(eq(contentItems.kind, type), eq(contentItems.slug, slug), eq(contentTranslations.locale, locale)))
    .limit(1);
  return row?.body ?? null;
}

// In development, read the index on every request (deduped within it), so a
// `npm run content:sync` shows up on refresh. In production, cache until a sync
// revalidates the tag.
const cachedIndex = isDev ? cache(readIndex) : unstable_cache(readIndex, ["content-index"], { tags: [CONTENT_TAG] });
const cachedBody = isDev ? cache(readBody) : unstable_cache(readBody, ["content-body"], { tags: [CONTENT_TAG] });

// --- public --------------------------------------------------------------------

export async function loadContent(): Promise<ContentStore> {
  return isLocal() ? stripBodies(loadLocal()) : cachedIndex();
}

/** The MDX body of one translation, or null if it doesn't exist. */
export async function loadBody(type: ContentType, slug: string, locale: Locale): Promise<string | null> {
  if (isLocal()) {
    const piece = loadLocal().pieces.find((p) => p.type === type && p.slug === slug);
    return piece?.translations[locale]?.body ?? null;
  }
  return cachedBody(type, slug, locale);
}
