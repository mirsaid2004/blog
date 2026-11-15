import { eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db, schema } from "@/lib/db";
import { contentOctokit, contentRepo } from "@/lib/github/app";
import { isContentPath, parseContent, type ContentIssue, type Translations } from "./parse";

/**
 * Rebuilds the content index in Neon from the content repo's `main` branch.
 *
 * 1. Read the commit's file tree (one API call) and keep the content paths.
 * 2. Download only blobs whose sha differs from the `content_files` mirror.
 * 3. Parse and validate every piece from the mirror plus the new blobs.
 * 4. In one transaction: update the mirror, upsert valid pieces, delete pieces
 *    whose folder is gone. Invalid pieces keep their last indexed version.
 *
 * Used by the webhook, the sync endpoint and `npm run content:sync`. The caller
 * revalidates the `content` cache tag afterwards.
 */

export const BRANCH = "main";

export interface SyncResult {
  commit: string;
  downloaded: number;
  removed: number;
  items: number;
  errors: ContentIssue[];
  warnings: ContentIssue[];
}

const BLOB_CONCURRENCY = 8;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function syncContent(): Promise<SyncResult> {
  const gh = contentOctokit();
  const repo = contentRepo();
  const database = db();

  const { data: ref } = await gh.git.getRef({ ...repo, ref: `heads/${BRANCH}` });
  const commit = ref.object.sha;
  const { data: tree } = await gh.git.getTree({ ...repo, tree_sha: commit, recursive: "1" });
  if (tree.truncated) throw new Error("The content repo tree is too large to read in one request");

  const remote = new Map(
    tree.tree
      .filter((entry) => entry.type === "blob" && entry.path && entry.sha && isContentPath(entry.path))
      .map((entry) => [entry.path!, entry.sha!])
  );

  const mirrored = await database.select().from(schema.contentFiles);
  const files = new Map(mirrored.filter((f) => remote.get(f.path) === f.sha).map((f) => [f.path, f.text]));
  const changed = [...remote].filter(([path]) => !files.has(path));
  const removed = mirrored.filter((f) => !remote.has(f.path)).map((f) => f.path);

  const downloaded = await mapLimit(changed, BLOB_CONCURRENCY, async ([path, sha]) => {
    const { data } = await gh.git.getBlob({ ...repo, file_sha: sha });
    const text = Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf8");
    files.set(path, text);
    return { path, sha, text };
  });

  const { store, errors, warnings, invalidDirs } = parseContent(files);

  // Delete items whose id is gone (folder deleted, or its id changed). Rows of
  // invalid folders stay, so the site keeps their last good version. A renamed
  // folder keeps its id, so the row (and later its views and ratings) survives.
  const existing = await database
    .select({ id: schema.contentItems.id, kind: schema.contentItems.kind, slug: schema.contentItems.slug })
    .from(schema.contentItems);
  const folderOf = (kind: string, slug: string) => `${kind === "series" ? "series" : `${kind}s`}/${slug}`;
  const fresh = new Set([...store.pieces.map((p) => p.meta.id), ...store.series.map((s) => s.meta.id)]);
  const held = new Set(invalidDirs);
  const stale = existing
    .filter((row) => !fresh.has(row.id) && !held.has(folderOf(row.kind, row.slug)))
    .map((row) => row.id);

  const items = [
    ...store.pieces.map((p) => ({
      row: {
        id: p.meta.id,
        kind: p.type,
        slug: p.slug,
        originalLocale: p.meta.originalLocale,
        publishedAt: p.meta.publishedAt,
        tags: p.meta.tags,
        cover: p.meta.cover ?? null,
        seriesItems: null,
      },
      translations: p.translations,
    })),
    ...store.series.map((s) => ({
      row: {
        id: s.meta.id,
        kind: "series" as const,
        slug: s.slug,
        originalLocale: s.meta.originalLocale,
        publishedAt: s.meta.publishedAt,
        tags: s.meta.tags,
        cover: s.meta.cover ?? null,
        seriesItems: s.meta.items,
      },
      translations: s.translations,
    })),
  ];

  const translationRows = (id: string, translations: Translations) =>
    Object.entries(translations).map(([locale, t]) => ({
      itemId: id,
      locale,
      title: t!.title,
      summary: t!.summary,
      status: t!.status,
      readMinutes: t!.readMinutes,
      body: t!.body,
      translatedFrom: t!.translatedFrom ?? null,
    }));

  const { contentFiles, contentItems, contentTranslations, contentSync } = schema;
  const statements: BatchItem<"pg">[] = [];

  if (removed.length) statements.push(database.delete(contentFiles).where(inArray(contentFiles.path, removed)));
  for (const file of downloaded) {
    statements.push(
      database
        .insert(contentFiles)
        .values(file)
        .onConflictDoUpdate({ target: contentFiles.path, set: { sha: file.sha, text: file.text, updatedAt: sql`now()` } })
    );
  }
  if (stale.length) statements.push(database.delete(contentItems).where(inArray(contentItems.id, stale)));
  for (const { row, translations } of items) {
    // Free the (kind, slug) pair if another id held it, then upsert by id.
    statements.push(
      database
        .delete(contentItems)
        .where(sql`${contentItems.kind} = ${row.kind} and ${contentItems.slug} = ${row.slug} and ${contentItems.id} <> ${row.id}`)
    );
    statements.push(
      database
        .insert(contentItems)
        .values(row)
        .onConflictDoUpdate({ target: contentItems.id, set: { ...row, updatedAt: sql`now()` } })
    );
    statements.push(database.delete(contentTranslations).where(eq(contentTranslations.itemId, row.id)));
    const rows = translationRows(row.id, translations);
    if (rows.length) statements.push(database.insert(contentTranslations).values(rows));
  }
  statements.push(
    database
      .insert(contentSync)
      .values({ id: 1, commitSha: commit, errors })
      .onConflictDoUpdate({ target: contentSync.id, set: { commitSha: commit, errors, syncedAt: sql`now()` } })
  );

  await database.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

  return { commit, downloaded: downloaded.length, removed: removed.length, items: items.length, errors, warnings };
}
