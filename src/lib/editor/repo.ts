import { contentOctokit, contentRepo } from "@/lib/github/app";
import { BRANCH as MAIN } from "@/lib/content/sync";
import { draftBranch, FOLDERS, type Folder, type PieceFiles } from "./format";

/**
 * Draft branches in the content repo (PLAN.md 2.2). Each piece in progress has a
 * `draft/<folder>/<slug>` branch covering all its languages. Save commits the
 * changed files to it through the Git Data API, Publish merges it into `main`
 * with a merge commit, Discard deletes it.
 */

export { MAIN };

export class EditorConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EditorConflictError";
  }
}

/** Octokit's RequestError carries the HTTP status. */
const isStatus = (error: unknown, ...statuses: number[]) =>
  typeof (error as { status?: unknown })?.status === "number" && statuses.includes((error as { status: number }).status);

const gh = () => contentOctokit();

export interface DraftRef {
  folder: Folder;
  slug: string;
  branch: string;
  sha: string;
}

/** Every open draft, from one API call. */
export async function listDrafts(): Promise<DraftRef[]> {
  const { data } = await gh().git.listMatchingRefs({ ...contentRepo(), ref: "heads/draft/" });
  return data.flatMap((ref) => {
    const match = ref.ref.match(/^refs\/heads\/(draft\/([a-z]+)\/([a-z0-9][a-z0-9-]*))$/);
    if (!match || !FOLDERS.includes(match[2] as Folder)) return [];
    return [{ branch: match[1], folder: match[2] as Folder, slug: match[3], sha: ref.object.sha }];
  });
}

/** The commit a branch points at, or null if the branch doesn't exist. */
export async function branchHead(branch: string): Promise<string | null> {
  try {
    const { data } = await gh().git.getRef({ ...contentRepo(), ref: `heads/${branch}` });
    return data.object.sha;
  } catch (error) {
    if (isStatus(error, 404)) return null;
    throw error;
  }
}

/** Text of the files in a piece folder at a commit (meta.yml and *.mdx only). */
export async function readPiece(folder: Folder, slug: string, ref: string): Promise<PieceFiles> {
  let entries: { name: string; type: string; sha: string }[];
  try {
    const { data } = await gh().repos.getContent({ ...contentRepo(), path: `${folder}/${slug}`, ref });
    entries = Array.isArray(data) ? data : [];
  } catch (error) {
    if (isStatus(error, 404)) return {};
    throw error;
  }
  const wanted = entries.filter((e) => e.type === "file" && /^(meta\.yml|[a-z]{2}\.mdx)$/.test(e.name));
  const texts = await Promise.all(wanted.map((e) => blobText(e.sha)));
  return Object.fromEntries(wanted.map((e, i) => [e.name, texts[i]]));
}

export async function blobText(sha: string): Promise<string> {
  const { data } = await gh().git.getBlob({ ...contentRepo(), file_sha: sha });
  return Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf8");
}

/** A file's text at a commit, or null if it didn't exist there. */
export async function fileAt(path: string, ref: string): Promise<string | null> {
  try {
    const { data } = await gh().repos.getContent({ ...contentRepo(), path, ref });
    if (Array.isArray(data) || data.type !== "file") return null;
    if ("content" in data && data.encoding === "base64" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf8");
    }
    return blobText(data.sha); // files over 1 MB come without inline content
  } catch (error) {
    if (isStatus(error, 404)) return null;
    throw error;
  }
}

/**
 * Commit changed files to the piece's draft branch, creating the branch from
 * `main` on the first save. `expectedHead` is the branch head the editor loaded
 * (null for no branch yet); if the branch moved since, nothing is written, so
 * two tabs can't silently overwrite each other.
 */
export async function commitToDraft(input: {
  folder: Folder;
  slug: string;
  expectedHead: string | null;
  changes: Record<string, string | null>;
  message: string;
  author: { name: string; email: string };
}): Promise<string> {
  const repo = contentRepo();
  const branch = draftBranch(input.folder, input.slug);
  const head = await branchHead(branch);
  if (head !== input.expectedHead) {
    throw new EditorConflictError("The draft changed somewhere else since you opened it. Reload to get the latest version.");
  }

  const parent = head ?? (await branchHead(MAIN));
  if (!parent) throw new Error("The content repo has no main branch");
  const { data: parentCommit } = await gh().git.getCommit({ ...repo, commit_sha: parent });

  // Deleting a path that isn't in the tree is an error, so only delete files that exist.
  const existing = await readPieceNames(input.folder, input.slug, parent);
  type TreeEntry = { path: string; mode: "100644"; type: "blob"; sha?: null; content?: string };
  const tree: TreeEntry[] = [];
  for (const [name, text] of Object.entries(input.changes)) {
    const path = `${input.folder}/${input.slug}/${name}`;
    if (text !== null) tree.push({ path, mode: "100644", type: "blob", content: text });
    else if (existing.has(name)) tree.push({ path, mode: "100644", type: "blob", sha: null });
  }
  if (tree.length === 0) return parent;

  const { data: newTree } = await gh().git.createTree({ ...repo, base_tree: parentCommit.tree.sha, tree });
  const { data: commit } = await gh().git.createCommit({
    ...repo,
    message: input.message,
    tree: newTree.sha,
    parents: [parent],
    author: { ...input.author, date: new Date().toISOString() },
  });

  try {
    if (head) await gh().git.updateRef({ ...repo, ref: `heads/${branch}`, sha: commit.sha, force: false });
    else await gh().git.createRef({ ...repo, ref: `refs/heads/${branch}`, sha: commit.sha });
  } catch (error) {
    if (isStatus(error, 409, 422)) {
      throw new EditorConflictError("The draft changed somewhere else while saving. Reload to get the latest version.");
    }
    throw error;
  }
  return commit.sha;
}

async function readPieceNames(folder: Folder, slug: string, ref: string): Promise<Set<string>> {
  try {
    const { data } = await gh().repos.getContent({ ...contentRepo(), path: `${folder}/${slug}`, ref });
    return new Set(Array.isArray(data) ? data.map((e) => e.name) : []);
  } catch (error) {
    if (isStatus(error, 404)) return new Set();
    throw error;
  }
}

/**
 * Merge `head` into `base` with a merge commit. Returns the merge commit, or
 * null when there was nothing to merge. Throws EditorConflictError on conflicts.
 */
export async function merge(base: string, head: string, message: string): Promise<string | null> {
  try {
    const result = await gh().repos.merge({ ...contentRepo(), base, head, commit_message: message });
    return result.status === 201 ? result.data.sha : null;
  } catch (error) {
    if (isStatus(error, 409)) {
      throw new EditorConflictError(
        "The draft and main changed the same lines. Resolve the conflict in the content repo, then try again."
      );
    }
    throw error;
  }
}

export async function deleteBranch(branch: string): Promise<void> {
  try {
    await gh().git.deleteRef({ ...contentRepo(), ref: `heads/${branch}` });
  } catch (error) {
    if (!isStatus(error, 404, 422)) throw error;
  }
}

/** Files of this piece that changed on `main` since the draft branched off. */
export async function mainChangesSince(branch: string, folder: Folder, slug: string): Promise<string[]> {
  const { data } = await gh().repos.compareCommitsWithBasehead({ ...contentRepo(), basehead: `${branch}...${MAIN}` });
  const prefix = `${folder}/${slug}/`;
  return (data.files ?? []).filter((f) => f.filename.startsWith(prefix)).map((f) => f.filename.slice(prefix.length));
}

export interface HistoryEntry {
  sha: string;
  message: string;
  date: string;
  author: string;
}

/** Commits that touched a file, newest first, as seen from `ref`. */
export async function fileHistory(path: string, ref: string): Promise<HistoryEntry[]> {
  const { data } = await gh().repos.listCommits({ ...contentRepo(), path, sha: ref, per_page: 50 });
  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    date: c.commit.author?.date ?? c.commit.committer?.date ?? "",
    author: c.commit.author?.name ?? c.author?.login ?? "",
  }));
}

/**
 * Lines added by any commit on a draft branch that isn't on `main` yet. The
 * orphan sweeper uses it to tell whether an image was ever referenced in a save.
 */
export async function draftAddedText(branch: string): Promise<string> {
  const repo = contentRepo();
  const { data } = await gh().repos.compareCommitsWithBasehead({ ...repo, basehead: `${MAIN}...${branch}` });
  const patches = await Promise.all(
    data.commits.map(async (c) => {
      const { data: commit } = await gh().repos.getCommit({ ...repo, ref: c.sha });
      return (commit.files ?? []).map((f) => f.patch ?? "").join("\n");
    })
  );
  return patches
    .join("\n")
    .split("\n")
    .filter((line) => line.startsWith("+"))
    .join("\n");
}
