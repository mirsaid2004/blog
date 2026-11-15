"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { deleteNoteAssets, IMAGE_TYPES, MAX_IMAGE_BYTES, prepareNoteUpload, type UploadTicket } from "@/lib/editor/assets";
import { SLUG } from "@/lib/editor/format";
import { EditorConflictError, fileAt, fileHistory, MAIN, type HistoryEntry } from "@/lib/editor/repo";
import { NOTES_DIR, noteIssues } from "./format";
import { commitNote, readNote, type NoteShas } from "./repo";

/** Server actions behind the notes editor. Admin only, like everything under /admin. */

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; conflict?: boolean };

const FILE_NAME = /^(meta\.yml|[a-z]{2}\.mdx)$/;
const slugSchema = z.string().regex(SLUG).max(100);
const shas = z.record(z.string().regex(FILE_NAME), z.string().regex(/^[0-9a-f]{40}$/));

function fail(error: unknown): { ok: false; error: string; conflict?: boolean } {
  if (error instanceof EditorConflictError) return { ok: false, error: error.message, conflict: true };
  console.error(error);
  return { ok: false, error: error instanceof z.ZodError ? z.prettifyError(error) : (error as Error).message };
}

const saveInput = z.object({
  slug: slugSchema,
  expected: shas,
  /** Every file of the note as the editor has it, to validate the whole note. */
  files: z.record(z.string().regex(FILE_NAME), z.string().max(1_000_000)),
  changes: z.record(z.string().regex(FILE_NAME), z.string().max(1_000_000).nullable()),
  auto: z.boolean().optional(),
});

export async function saveNote(input: z.input<typeof saveInput>): Promise<Result<{ shas: NoteShas }>> {
  try {
    const viewer = await requireAdmin();
    const { slug, expected, files, changes, auto } = saveInput.parse(input);
    const issues = noteIssues(files);
    if (issues.length) return { ok: false, error: issues.join("\n") };
    const result = await commitNote({
      slug,
      expected,
      changes,
      message: `${auto ? "Autosave" : "Update"} note ${slug}`,
      author: { name: viewer.name, email: viewer.email },
    });
    return { ok: true, shas: result };
  } catch (error) {
    return fail(error);
  }
}

/** Delete the note's files from main and its images from the private bucket. */
export async function deleteNote(input: { slug: string; noteId: string; expected: NoteShas }): Promise<Result> {
  try {
    const viewer = await requireAdmin();
    const slug = slugSchema.parse(input.slug);
    const expected = shas.parse(input.expected);
    const noteId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).parse(input.noteId);
    await commitNote({
      slug,
      expected,
      changes: Object.fromEntries(Object.keys(expected).map((name) => [name, null])),
      message: `Delete note ${slug}`,
      author: { name: viewer.name, email: viewer.email },
    });
    await deleteNoteAssets(noteId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function checkNoteSlug(slug: string): Promise<Result<{ available: boolean }>> {
  try {
    await requireAdmin();
    const { files } = await readNote(slugSchema.parse(slug));
    return { ok: true, available: Object.keys(files).length === 0 };
  } catch (error) {
    return fail(error);
  }
}

const uploadInput = z.object({
  noteId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  hash: z.string().regex(/^[0-9a-f]{16}$/),
  contentType: z.enum(Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES]),
  bytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
});

export async function requestNoteUpload(input: z.input<typeof uploadInput>): Promise<Result<UploadTicket>> {
  try {
    await requireAdmin();
    return { ok: true, ...(await prepareNoteUpload(uploadInput.parse(input))) };
  } catch (error) {
    return fail(error);
  }
}

export async function loadNoteHistory(input: { slug: string; file: string }): Promise<Result<{ entries: HistoryEntry[] }>> {
  try {
    await requireAdmin();
    const slug = slugSchema.parse(input.slug);
    const file = z.string().regex(FILE_NAME).parse(input.file);
    return { ok: true, entries: await fileHistory(`${NOTES_DIR}/${slug}/${file}`, MAIN) };
  } catch (error) {
    return fail(error);
  }
}

export async function loadNoteVersion(input: { slug: string; file: string; sha: string }): Promise<Result<{ text: string | null }>> {
  try {
    await requireAdmin();
    const slug = slugSchema.parse(input.slug);
    const file = z.string().regex(FILE_NAME).parse(input.file);
    const sha = z.string().regex(/^[0-9a-f]{40}$/).parse(input.sha);
    return { ok: true, text: await fileAt(`${NOTES_DIR}/${slug}/${file}`, sha) };
  } catch (error) {
    return fail(error);
  }
}
