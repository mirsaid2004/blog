"use server";

import type { ReactNode } from "react";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { mdxComponents } from "@/components/article/mdx-components";
import { requireAdmin } from "@/lib/auth";
import { compileMdx } from "@/lib/content/mdx";
import { CONTENT_TAG } from "@/lib/content/source";
import { db, schema } from "@/lib/db";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, deleteUnpublished, prepareUpload, type UploadTicket } from "./assets";
import { draftBranch, FOLDERS, kindOf, parseDoc, serializeMeta, SLUG, type Folder } from "./format";
import {
  blobText,
  branchHead,
  commitToDraft,
  deleteBranch,
  EditorConflictError,
  fileAt,
  fileHistory,
  MAIN,
  merge,
  readPiece,
  type HistoryEntry,
} from "./repo";
import { clearSchedule, publishBranch, setSchedule } from "./publish";

/**
 * Server actions behind the editor. Every one checks the admin session first:
 * they are public endpoints, whatever the UI shows.
 */

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; conflict?: boolean };

const piece = z.object({ folder: z.enum(FOLDERS), slug: z.string().regex(SLUG).max(100) });
const FILE_NAME = /^(meta\.yml|[a-z]{2}\.mdx)$/;
const SHA = z.string().regex(/^[0-9a-f]{40}$/);

function fail(error: unknown): { ok: false; error: string; conflict?: boolean } {
  if (error instanceof EditorConflictError) return { ok: false, error: error.message, conflict: true };
  console.error(error);
  return { ok: false, error: error instanceof z.ZodError ? z.prettifyError(error) : (error as Error).message };
}

const saveInput = piece.extend({
  expectedHead: SHA.nullable(),
  changes: z.record(z.string().regex(FILE_NAME), z.string().max(1_000_000).nullable()),
  message: z.string().trim().max(200).optional(),
});

/** Commit the changed files to the draft branch (created on the first save). */
export async function saveDraft(input: z.input<typeof saveInput>): Promise<Result<{ head: string }>> {
  try {
    const viewer = await requireAdmin();
    const { folder, slug, expectedHead, changes, message } = saveInput.parse(input);
    const names = Object.keys(changes).map((n) => n.replace(/\.(mdx|yml)$/, ""));
    const head = await commitToDraft({
      folder,
      slug,
      expectedHead,
      changes,
      message: message || `Update ${folder}/${slug} (${names.join(", ")})`,
      author: { name: viewer.name, email: viewer.email },
    });
    return { ok: true, head };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Validate the saved draft, merge it into main, then index it right away
 * (the webhook would too, a few seconds later).
 */
export async function publishDraft(input: z.input<typeof piece> & { expectedHead: string }): Promise<Result> {
  try {
    await requireAdmin();
    const { folder, slug } = piece.parse(input);
    await publishBranch(folder, slug, SHA.parse(input.expectedHead));
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

const scheduleInput = piece.extend({
  publishAt: z.iso.datetime({ offset: true }).nullable(),
  /** The date the reader sees (YYYY-MM-DD, in the admin's time zone). */
  publishDate: z.iso.date().optional(),
  expectedHead: SHA.optional(),
});

/**
 * Set (or with null, cancel) the time a saved draft goes live. If the piece's
 * publish date differs from the scheduled day, the draft's meta.yml is updated
 * first, and the new head is returned.
 */
export async function scheduleDraft(input: z.input<typeof scheduleInput>): Promise<Result<{ head?: string }>> {
  try {
    const viewer = await requireAdmin();
    const { folder, slug, publishAt, publishDate, expectedHead } = scheduleInput.parse(input);
    if (publishAt === null) {
      await clearSchedule(folder, slug);
      return { ok: true };
    }
    const at = new Date(publishAt);
    if (at.getTime() < Date.now() - 60_000) return { ok: false, error: "That time is in the past." };
    const branch = draftBranch(folder, slug);
    let head = await branchHead(branch);
    if (!head) return { ok: false, error: "Save the draft before scheduling it." };
    if (expectedHead && head !== expectedHead) {
      return { ok: false, error: "The draft changed somewhere else. Reload first.", conflict: true };
    }

    let newHead: string | undefined;
    if (publishDate) {
      const files = await readPiece(folder, slug, head);
      const doc = parseDoc(files, "en");
      if (doc.meta.publishedAt !== publishDate) {
        head = await commitToDraft({
          folder,
          slug,
          expectedHead: head,
          changes: { "meta.yml": serializeMeta({ ...doc.meta, publishedAt: publishDate }, kindOf(folder)) },
          message: `Schedule ${folder}/${slug} for ${publishDate}`,
          author: { name: viewer.name, email: viewer.email },
        });
        newHead = head;
      }
    }
    await setSchedule(folder, slug, at);
    return { ok: true, ...(newHead ? { head: newHead } : {}) };
  } catch (error) {
    return fail(error);
  }
}

/** Delete the draft branch and the images that only it used. */
export async function discardDraft(input: z.input<typeof piece>): Promise<Result<{ deletedImages: number }>> {
  try {
    await requireAdmin();
    const { folder, slug } = piece.parse(input);
    const branch = draftBranch(folder, slug);
    await deleteBranch(branch);
    await clearSchedule(folder, slug);
    return { ok: true, deletedImages: await deleteUnpublished(branch) };
  } catch (error) {
    return fail(error);
  }
}

/** Bring changes made on main (e.g. in VS Code) into the draft. */
export async function updateDraftFromMain(input: z.input<typeof piece>): Promise<Result> {
  try {
    await requireAdmin();
    const { folder, slug } = piece.parse(input);
    await merge(draftBranch(folder, slug), MAIN, `Merge main into draft ${folder}/${slug}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

const uploadInput = piece.extend({
  contentId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  hash: z.string().regex(/^[0-9a-f]{16}$/),
  contentType: z.enum(Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES]),
  bytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
});

export async function requestUpload(input: z.input<typeof uploadInput>): Promise<Result<UploadTicket>> {
  try {
    await requireAdmin();
    const { folder, slug, ...rest } = uploadInput.parse(input);
    return { ok: true, ...(await prepareUpload({ ...rest, branch: draftBranch(folder, slug) })) };
  } catch (error) {
    return fail(error);
  }
}

const historyInput = piece.extend({ file: z.string().regex(FILE_NAME), ref: z.string().min(1).max(200) });

export async function loadHistory(input: z.input<typeof historyInput>): Promise<Result<{ entries: HistoryEntry[] }>> {
  try {
    await requireAdmin();
    const { folder, slug, file, ref } = historyInput.parse(input);
    return { ok: true, entries: await fileHistory(`${folder}/${slug}/${file}`, ref) };
  } catch (error) {
    return fail(error);
  }
}

export async function loadVersion(
  input: z.input<typeof piece> & { file: string; sha: string }
): Promise<Result<{ text: string | null }>> {
  try {
    await requireAdmin();
    const { folder, slug } = piece.parse(input);
    const file = z.string().regex(FILE_NAME).parse(input.file);
    return { ok: true, text: await fileAt(`${folder}/${slug}/${file}`, SHA.parse(input.sha)) };
  } catch (error) {
    return fail(error);
  }
}

/** A file by blob sha: the original as it was when a translation was last brought up to date. */
export async function loadBlob(sha: string): Promise<Result<{ text: string }>> {
  try {
    await requireAdmin();
    return { ok: true, text: await blobText(SHA.parse(sha)) };
  } catch (error) {
    return fail(error);
  }
}

/** Render MDX with the live site's compiler and components. */
export async function renderPreview(source: string): Promise<Result<{ node: ReactNode }>> {
  try {
    await requireAdmin();
    const { content } = await compileMdx(z.string().max(1_000_000).parse(source), mdxComponents);
    return { ok: true, node: content };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/** Whether a new piece can use this slug: not on main and no draft with it. */
export async function checkSlug(input: z.input<typeof piece>): Promise<Result<{ available: boolean }>> {
  try {
    await requireAdmin();
    const { folder, slug } = piece.parse(input);
    const [row] = await db()
      .select({ id: schema.contentItems.id })
      .from(schema.contentItems)
      .where(and(eq(schema.contentItems.kind, kindOf(folder as Folder)), eq(schema.contentItems.slug, slug)))
      .limit(1);
    const available = !row && (await branchHead(draftBranch(folder, slug))) === null;
    return { ok: true, available };
  } catch (error) {
    return fail(error);
  }
}
