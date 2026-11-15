import { and, eq, lte, sql } from "drizzle-orm";
import { syncContent } from "@/lib/content/sync";
import { db, schema } from "@/lib/db";
import { markPublished } from "./assets";
import { draftBranch, type Folder } from "./format";
import { branchHead, deleteBranch, EditorConflictError, MAIN, merge, readPiece } from "./repo";
import { validatePiece } from "./validate";

/**
 * Publishing a draft: validate what's on the branch, merge it into main with a
 * merge commit, then clean up and re-index. Shared by the Publish button and
 * the hourly scheduled-publish job. The caller revalidates the content tag.
 */

export class PublishValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join("\n"));
    this.name = "PublishValidationError";
  }
}

/**
 * `expectedHead` (from the editor) guards against publishing something other
 * than what the editor showed; the scheduler passes null to publish whatever
 * the draft holds at that moment.
 */
export async function publishBranch(folder: Folder, slug: string, expectedHead: string | null): Promise<void> {
  const branch = draftBranch(folder, slug);
  const head = await branchHead(branch);
  if (!head) throw new Error(`There is no draft for ${folder}/${slug}`);
  if (expectedHead !== null && head !== expectedHead) {
    throw new EditorConflictError("The draft changed somewhere else. Reload before publishing.");
  }

  const files = await readPiece(folder, slug, head);
  const { errors } = await validatePiece(folder, slug, files);
  if (errors.length) throw new PublishValidationError(errors.map((e) => `${e.path}: ${e.message}`));

  await merge(MAIN, branch, `Publish ${folder}/${slug}`);
  await markPublished(branch);
  await deleteBranch(branch);
  await db()
    .delete(schema.scheduledPublish)
    .where(and(eq(schema.scheduledPublish.folder, folder), eq(schema.scheduledPublish.slug, slug)));
  await syncContent();
}

export interface Schedule {
  folder: Folder;
  slug: string;
  publishAt: Date;
  lastError: string | null;
}

export async function getSchedule(folder: Folder, slug: string): Promise<Schedule | null> {
  const [row] = await db()
    .select()
    .from(schema.scheduledPublish)
    .where(and(eq(schema.scheduledPublish.folder, folder), eq(schema.scheduledPublish.slug, slug)))
    .limit(1);
  return row ? { folder: row.folder, slug: row.slug, publishAt: row.publishAt, lastError: row.lastError } : null;
}

export async function listSchedules(): Promise<Schedule[]> {
  const rows = await db().select().from(schema.scheduledPublish).orderBy(schema.scheduledPublish.publishAt);
  return rows.map((r) => ({ folder: r.folder, slug: r.slug, publishAt: r.publishAt, lastError: r.lastError }));
}

export async function setSchedule(folder: Folder, slug: string, publishAt: Date): Promise<void> {
  await db()
    .insert(schema.scheduledPublish)
    .values({ folder, slug, publishAt })
    .onConflictDoUpdate({
      target: [schema.scheduledPublish.folder, schema.scheduledPublish.slug],
      set: { publishAt, lastError: null, createdAt: sql`now()` },
    });
}

export async function clearSchedule(folder: Folder, slug: string): Promise<void> {
  await db()
    .delete(schema.scheduledPublish)
    .where(and(eq(schema.scheduledPublish.folder, folder), eq(schema.scheduledPublish.slug, slug)));
}

/**
 * Publish every draft whose time has come. A failure (invalid content, merge
 * conflict, draft deleted) is stored on the row and retried next hour; a
 * schedule whose draft is gone is dropped.
 */
export async function publishDue(now = new Date()) {
  const due = await db()
    .select()
    .from(schema.scheduledPublish)
    .where(lte(schema.scheduledPublish.publishAt, now))
    .orderBy(schema.scheduledPublish.publishAt);

  const results: { piece: string; ok: boolean; error?: string }[] = [];
  for (const row of due) {
    const piece = `${row.folder}/${row.slug}`;
    try {
      if (!(await branchHead(draftBranch(row.folder, row.slug)))) {
        await clearSchedule(row.folder, row.slug);
        results.push({ piece, ok: false, error: "draft no longer exists; schedule removed" });
        continue;
      }
      await publishBranch(row.folder, row.slug, null);
      results.push({ piece, ok: true });
    } catch (error) {
      const message = (error as Error).message;
      await db()
        .update(schema.scheduledPublish)
        .set({ lastError: message })
        .where(and(eq(schema.scheduledPublish.folder, row.folder), eq(schema.scheduledPublish.slug, row.slug)));
      results.push({ piece, ok: false, error: message });
    }
  }
  return results;
}
