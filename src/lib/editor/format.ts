import type { Locale } from "next-intl";
import { parse as parseYaml, stringify } from "yaml";
import { routing } from "@/i18n/routing";
import type { ContentType } from "@/lib/content/types";

/**
 * The editor's in-memory model of one piece and its round trip to the files in
 * the content repo (`meta.yml` + `<locale>.mdx`, see PLAN.md 2.1). Shared by the
 * client editor and the server actions.
 */

export const FOLDERS = ["articles", "posts", "series"] as const;
export type Folder = (typeof FOLDERS)[number];
export type PieceKind = ContentType | "series";

export const kindOf = (folder: Folder): PieceKind =>
  folder === "articles" ? "article" : folder === "posts" ? "post" : "series";
export const folderOf = (kind: PieceKind): Folder => (kind === "series" ? "series" : `${kind}s`);

export const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** One draft branch per piece, covering every language. */
export const draftBranch = (folder: Folder, slug: string) => `draft/${folder}/${slug}`;

export interface DocMeta {
  id: string;
  originalLocale: Locale;
  publishedAt: string;
  tags: string[];
  cover?: string;
  /** Series only. */
  items?: string[];
}

export interface DocTranslation {
  title: string;
  summary: string;
  status: "draft" | "published";
  translatedFrom?: string;
  body: string;
}

export interface EditorDoc {
  meta: DocMeta;
  translations: Partial<Record<Locale, DocTranslation>>;
}

/** File name in the piece folder → text. */
export type PieceFiles = Record<string, string>;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*(?:\r?\n|$)/;
const YAML = { lineWidth: 0 } as const;

export const isLocale = (value: unknown): value is Locale => routing.locales.includes(value as Locale);

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : value == null ? fallback : String(value);
const asStrings = (value: unknown) => (Array.isArray(value) ? value.map((v) => asString(v)).filter(Boolean) : []);
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

function safeYaml(text: string): Record<string, unknown> {
  try {
    return asRecord(parseYaml(text));
  } catch {
    return {};
  }
}

/**
 * Read files into the editor model. Lenient on purpose: a file edited by hand
 * may be invalid, and the editor is where it gets fixed. Validation happens on
 * publish with the content schemas.
 */
export function parseDoc(files: PieceFiles, fallbackLocale: Locale): EditorDoc {
  const meta = safeYaml(files["meta.yml"] ?? "");
  const originalLocale = isLocale(meta.originalLocale) ? meta.originalLocale : fallbackLocale;
  const translations: EditorDoc["translations"] = {};

  for (const locale of routing.locales) {
    const text = files[`${locale}.mdx`];
    if (text === undefined) continue;
    const match = text.match(FRONTMATTER);
    const front = match ? safeYaml(match[1]) : {};
    translations[locale] = {
      title: asString(front.title),
      summary: asString(front.summary),
      status: front.status === "published" ? "published" : "draft",
      ...(typeof front.translatedFrom === "string" ? { translatedFrom: front.translatedFrom } : {}),
      body: (match ? text.slice(match[0].length) : text).trim(),
    };
  }

  return {
    meta: {
      id: asString(meta.id),
      originalLocale,
      publishedAt: asString(meta.publishedAt),
      tags: asStrings(meta.tags),
      ...(meta.cover ? { cover: asString(meta.cover) } : {}),
      ...("items" in meta ? { items: asStrings(meta.items) } : {}),
    },
    translations,
  };
}

export function serializeMeta(meta: DocMeta, kind: PieceKind): string {
  const out: Record<string, unknown> = {
    id: meta.id,
    originalLocale: meta.originalLocale,
    publishedAt: meta.publishedAt,
    tags: meta.tags,
  };
  if (meta.cover) out.cover = meta.cover;
  if (kind === "series") out.items = meta.items ?? [];
  return stringify(out, YAML);
}

export function serializeTranslation(t: DocTranslation): string {
  const front: Record<string, unknown> = { title: t.title, summary: t.summary, status: t.status };
  if (t.translatedFrom) front.translatedFrom = t.translatedFrom;
  const body = t.body.trim();
  return `---\n${stringify(front, YAML)}---\n${body ? `\n${body}\n` : ""}`;
}

export function serializeDoc(doc: EditorDoc, kind: PieceKind): PieceFiles {
  const files: PieceFiles = { "meta.yml": serializeMeta(doc.meta, kind) };
  for (const locale of routing.locales) {
    const t = doc.translations[locale];
    if (t) files[`${locale}.mdx`] = serializeTranslation(t);
  }
  return files;
}

/** Files that differ between two serializations: new text, or null for a deleted file. */
export function changedFiles(before: PieceFiles, after: PieceFiles): Record<string, string | null> {
  const changes: Record<string, string | null> = {};
  for (const [name, text] of Object.entries(after)) if (before[name] !== text) changes[name] = text;
  for (const name of Object.keys(before)) if (!(name in after)) changes[name] = null;
  return changes;
}

/** Git's blob sha of a text file: sha1("blob <bytes>\0<content>"). Works in the browser and in Node. */
export async function gitBlobSha(text: string): Promise<string> {
  const content = new TextEncoder().encode(text);
  const header = new TextEncoder().encode(`blob ${content.length}\0`);
  const data = new Uint8Array(header.length + content.length);
  data.set(header);
  data.set(content, header.length);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A ULID: 48-bit time + 80 random bits, Crockford base32. Sorts by creation time. */
export function newId(now = Date.now()): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let time = "";
  for (let i = 0, t = now; i < 10; i++, t = Math.floor(t / 32)) time = alphabet[t % 32] + time;
  const random = crypto.getRandomValues(new Uint8Array(16));
  return time + [...random].map((b) => alphabet[b % 32]).join("");
}

export const today = () => new Date().toISOString().slice(0, 10);

export function emptyTranslation(): DocTranslation {
  return { title: "", summary: "", status: "draft", body: "" };
}

export function newDoc(kind: PieceKind, originalLocale: Locale): EditorDoc {
  return {
    meta: {
      id: newId(),
      originalLocale,
      publishedAt: today(),
      tags: [],
      ...(kind === "series" ? { items: [] } : {}),
    },
    translations: { [originalLocale]: emptyTranslation() },
  };
}
