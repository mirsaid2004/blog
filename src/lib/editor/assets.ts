import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deleteObjects, objectExists, presignPut, publicBucket } from "@/lib/r2";
import { draftAddedText, listDrafts } from "./repo";

/**
 * Image bookkeeping for the editor (PLAN.md 2.3). Each upload gets an `asset`
 * row before the object exists, so cleanup can always find it:
 * publishing a draft marks its images permanent, discarding deletes the ones
 * that never reached `main`, and a sweeper removes what slips through.
 */

export const IMAGE_TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/gif": "gif" } as const;
export type ImageType = keyof typeof IMAGE_TYPES;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface UploadTicket {
  key: string;
  /** Presigned PUT URL, or null when the image is already in R2 (same hash). */
  url: string | null;
}

/** Record the image, then hand out an upload URL for it. */
export async function prepareUpload(input: {
  contentId: string;
  branch: string;
  hash: string;
  contentType: ImageType;
  bytes: number;
}): Promise<UploadTicket> {
  const bucket = publicBucket();
  const key = `content/${input.contentId}/${input.hash}.${IMAGE_TYPES[input.contentType]}`;
  await db()
    .insert(schema.asset)
    .values({ key, contentId: input.contentId, draftBranch: input.branch, bucket, bytes: input.bytes })
    .onConflictDoNothing();
  if (await objectExists(bucket, key)) return { key, url: null };
  return { key, url: await presignPut(bucket, key, input.contentType) };
}

/** After a merge into main: every image of the draft is now part of permanent history. */
export async function markPublished(branch: string): Promise<void> {
  await db()
    .update(schema.asset)
    .set({ publishedAt: sql`now()` })
    .where(and(eq(schema.asset.draftBranch, branch), isNull(schema.asset.publishedAt)));
}

async function deleteAssets(rows: { key: string; bucket: string }[]): Promise<number> {
  const byBucket = new Map<string, string[]>();
  for (const { key, bucket } of rows) byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), key]);
  for (const [bucket, keys] of byBucket) await deleteObjects(bucket, keys);
  if (rows.length) await db().delete(schema.asset).where(inArray(schema.asset.key, rows.map((r) => r.key)));
  return rows.length;
}

/** After discarding a draft: delete its images that never reached main. */
export async function deleteUnpublished(branch: string): Promise<number> {
  const rows = await db()
    .select({ key: schema.asset.key, bucket: schema.asset.bucket })
    .from(schema.asset)
    .where(and(eq(schema.asset.draftBranch, branch), isNull(schema.asset.publishedAt)));
  return deleteAssets(rows);
}

/**
 * Safety net, run weekly. Deletes unpublished images older than a day whose
 * draft branch is gone (deleted on GitHub), or that no commit on the branch
 * ever referenced (pasted, then removed before a save).
 */
export async function sweepOrphanAssets(): Promise<{ checked: number; deleted: number }> {
  const candidates = await db()
    .select({ key: schema.asset.key, bucket: schema.asset.bucket, branch: schema.asset.draftBranch })
    .from(schema.asset)
    .where(and(isNull(schema.asset.publishedAt), lt(schema.asset.createdAt, sql`now() - interval '1 day'`)));
  if (candidates.length === 0) return { checked: 0, deleted: 0 };

  const open = new Set((await listDrafts()).map((d) => d.branch));
  const added = new Map<string, string>();
  const orphans: { key: string; bucket: string }[] = [];

  for (const asset of candidates) {
    if (!asset.branch || !open.has(asset.branch)) {
      orphans.push(asset);
      continue;
    }
    if (!added.has(asset.branch)) added.set(asset.branch, await draftAddedText(asset.branch));
    if (!added.get(asset.branch)!.includes(asset.key)) orphans.push(asset);
  }
  return { checked: candidates.length, deleted: await deleteAssets(orphans) };
}
