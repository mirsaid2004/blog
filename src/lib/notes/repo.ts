import { unstable_cache } from "next/cache";
import type { Locale } from "next-intl";
import { contentOctokit, contentRepo } from "@/lib/github/app";
import { branchHead, EditorConflictError, MAIN } from "@/lib/editor/repo";
import { gitBlobSha, SLUG } from "@/lib/editor/format";
import { NOTES_DIR, parseNote, type NoteFiles } from "./format";

/**
 * Notes in the content repo, read and written on `main` directly (they are
 * never published, so they skip draft branches). Conflicts are detected per
 * file: a save names the blob shas it started from, and is refused if any of
 * the note's files changed since.
 */

const gh = () => contentOctokit();
const isStatus = (error: unknown, ...statuses: number[]) =>
  typeof (error as { status?: unknown })?.status === "number" && statuses.includes((error as { status: number }).status);

/** Blob text by sha. Blobs are content-addressed, so the cache never goes stale. */
const blobText = unstable_cache(
  async (sha: string) => {
    const { data } = await gh().git.getBlob({ ...contentRepo(), file_sha: sha });
    return Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf8");
  },
  ["note-blob"],
  { revalidate: false }
);

export type NoteShas = Record<string, string>;

export interface NoteSummary {
  slug: string;
  id: string;
  title: string;
  languages: Locale[];
  tags: string[];
}

/** All notes: one tree read, plus each changed file's blob (cached by sha). */
export async function listNotes(): Promise<NoteSummary[]> {
  const head = await branchHead(MAIN);
  if (!head) return [];
  const { data: tree } = await gh().git.getTree({ ...contentRepo(), tree_sha: head, recursive: "1" });
  const byNote = new Map<string, Record<string, string>>();
  for (const entry of tree.tree) {
    const match = entry.path?.match(/^notes\/([a-z0-9][a-z0-9-]*)\/(meta\.yml|[a-z]{2}\.mdx)$/);
    if (!match || entry.type !== "blob" || !entry.sha) continue;
    byNote.set(match[1], { ...byNote.get(match[1]), [match[2]]: entry.sha });
  }

  const notes = await Promise.all(
    [...byNote].map(async ([slug, shas]) => {
      const files = Object.fromEntries(
        await Promise.all(Object.entries(shas).map(async ([name, sha]) => [name, await blobText(sha)] as const))
      );
      const doc = parseNote(files, "en");
      const original = doc.translations[doc.meta.originalLocale] ?? Object.values(doc.translations)[0];
      return {
        slug,
        id: doc.meta.id,
        title: original?.title || slug,
        languages: Object.keys(doc.translations) as Locale[],
        tags: doc.meta.tags,
      };
    })
  );
  return notes.sort((a, b) => a.title.localeCompare(b.title));
}

async function noteShas(slug: string, ref: string): Promise<NoteShas> {
  try {
    const { data } = await gh().repos.getContent({ ...contentRepo(), path: `${NOTES_DIR}/${slug}`, ref });
    if (!Array.isArray(data)) return {};
    return Object.fromEntries(
      data.filter((e) => e.type === "file" && /^(meta\.yml|[a-z]{2}\.mdx)$/.test(e.name)).map((e) => [e.name, e.sha])
    );
  } catch (error) {
    if (isStatus(error, 404)) return {};
    throw error;
  }
}

/** A note's files on main, with their blob shas (for the save conflict check). */
export async function readNote(slug: string): Promise<{ files: NoteFiles; shas: NoteShas }> {
  if (!SLUG.test(slug)) return { files: {}, shas: {} };
  const shas = await noteShas(slug, MAIN);
  const entries = await Promise.all(Object.entries(shas).map(async ([name, sha]) => [name, await blobText(sha)] as const));
  return { files: Object.fromEntries(entries), shas };
}

/**
 * Commit changed files (null deletes) to main. Retries when main moved for
 * an unrelated reason (e.g. a publish) between reading it and updating it.
 */
export async function commitNote(input: {
  slug: string;
  expected: NoteShas;
  changes: Record<string, string | null>;
  message: string;
  author: { name: string; email: string };
  /** Always main in the app; tests point it at a throwaway branch. */
  branch?: string;
}): Promise<NoteShas> {
  const repo = contentRepo();
  const branch = input.branch ?? MAIN;
  for (let attempt = 0; attempt < 3; attempt++) {
    const head = await branchHead(branch);
    if (!head) throw new Error("The content repo has no main branch");
    const current = await noteShas(input.slug, head);
    const names = new Set([...Object.keys(current), ...Object.keys(input.expected)]);
    for (const name of names) {
      if (current[name] !== input.expected[name]) {
        throw new EditorConflictError("This note changed somewhere else since you opened it. Reload to get the latest version.");
      }
    }

    type TreeEntry = { path: string; mode: "100644"; type: "blob"; sha?: null; content?: string };
    const tree: TreeEntry[] = [];
    for (const [name, text] of Object.entries(input.changes)) {
      const path = `${NOTES_DIR}/${input.slug}/${name}`;
      if (text !== null) tree.push({ path, mode: "100644", type: "blob", content: text });
      else if (current[name]) tree.push({ path, mode: "100644", type: "blob", sha: null });
    }
    if (tree.length === 0) return current;

    const { data: parent } = await gh().git.getCommit({ ...repo, commit_sha: head });
    const { data: newTree } = await gh().git.createTree({
      ...repo,
      base_tree: parent.tree.sha,
      tree,
    });
    const { data: commit } = await gh().git.createCommit({
      ...repo,
      message: input.message,
      tree: newTree.sha,
      parents: [head],
      author: { ...input.author, date: new Date().toISOString() },
    });
    try {
      await gh().git.updateRef({ ...repo, ref: `heads/${branch}`, sha: commit.sha, force: false });
    } catch (error) {
      if (isStatus(error, 409, 422)) continue; // main moved; re-check and try again
      throw error;
    }

    const next: NoteShas = { ...current };
    for (const [name, text] of Object.entries(input.changes)) {
      if (text === null) delete next[name];
      else next[name] = await gitBlobSha(text);
    }
    return next;
  }
  throw new Error(`${branch} kept changing while saving; try again.`);
}
