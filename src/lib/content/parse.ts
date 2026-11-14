import type { Locale } from "next-intl";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import {
  pieceMetaSchema,
  seriesMetaSchema,
  translationSchema,
  type PieceMeta,
  type SeriesMeta,
  type TranslationFrontmatter,
} from "./schema";
import type { ContentType } from "./types";

/**
 * Parses the content repo layout, given as a map of repo-relative path → text:
 *
 *   <articles|posts|series>/<slug>/meta.yml      shared by every language
 *   <articles|posts|series>/<slug>/<locale>.mdx  one file per language
 *
 * The folder gives the type and slug. Anything else (README, notes/, ...) is
 * ignored. Each piece is validated on its own: an invalid one is reported in
 * `errors` and left out, so one typo never hides the rest of the site.
 */

const WORDS_PER_MINUTE = 200;
const FOLDERS = { articles: "article", posts: "post", series: "series" } as const;
type Folder = keyof typeof FOLDERS;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*(?:\r?\n|$)/;
const CONTENT_PATH = new RegExp(
  `^(${Object.keys(FOLDERS).join("|")})/([a-z0-9][a-z0-9-]*)/(meta\\.yml|(${routing.locales.join("|")})\\.mdx)$`
);

export interface Translation extends TranslationFrontmatter {
  /** MDX body without frontmatter. */
  body: string;
  readMinutes: number;
}

export type Translations<T = Translation> = Partial<Record<Locale, T>>;

export interface PieceSource<T = Translation> {
  type: ContentType;
  slug: string;
  meta: PieceMeta;
  translations: Translations<T>;
}

export interface SeriesSource<T = Translation> {
  slug: string;
  meta: SeriesMeta;
  translations: Translations<T>;
}

export interface ContentStore<T = Translation> {
  pieces: PieceSource<T>[];
  series: SeriesSource<T>[];
}

export interface ContentIssue {
  /** Repo-relative file (or piece folder) the problem is in. */
  path: string;
  message: string;
}

export interface ParseResult {
  store: ContentStore;
  errors: ContentIssue[];
  warnings: ContentIssue[];
  /** Piece folders (`<folder>/<slug>`) that failed validation. */
  invalidDirs: string[];
}

/** Whether a repo path is part of the published content (and should be mirrored). */
export function isContentPath(path: string): boolean {
  return CONTENT_PATH.test(path);
}

class ContentError extends Error {
  constructor(
    readonly path: string,
    message: string
  ) {
    super(message);
    this.name = "ContentError";
  }
}

function validate<T>(schema: z.ZodType<T>, data: unknown, path: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ContentError(path, z.prettifyError(result.error));
  return result.data;
}

function parseYamlIn(text: string, path: string): unknown {
  try {
    return parseYaml(text);
  } catch (error) {
    throw new ContentError(path, (error as Error).message);
  }
}

export function readMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Split a `<locale>.mdx` file into validated frontmatter and body. */
export function parseTranslation(source: string, path: string): Translation {
  const match = source.match(FRONTMATTER);
  if (!match) throw new ContentError(path, "missing frontmatter (title, summary, status)");
  const frontmatter = validate(translationSchema, parseYamlIn(match[1], path), path);
  const body = source.slice(match[0].length).trim();
  return { ...frontmatter, body, readMinutes: readMinutes(body) };
}

function readDir(dir: string, files: Map<string, string>, schema: z.ZodType<PieceMeta | SeriesMeta>) {
  const metaPath = `${dir}/meta.yml`;
  const metaText = files.get(metaPath);
  if (metaText === undefined) throw new ContentError(metaPath, "meta.yml is missing");
  const meta = validate(schema, parseYamlIn(metaText, metaPath), metaPath);

  const translations: Translations = {};
  for (const locale of routing.locales) {
    const path = `${dir}/${locale}.mdx`;
    const source = files.get(path);
    if (source !== undefined) translations[locale] = parseTranslation(source, path);
  }
  if (!translations[meta.originalLocale]) {
    throw new ContentError(`${dir}/${meta.originalLocale}.mdx`, "the original-language file is missing");
  }
  return { meta, translations };
}

export function parseContent(files: Map<string, string>): ParseResult {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];
  const invalidDirs: string[] = [];

  const dirs = new Map<string, { folder: Folder; slug: string }>();
  for (const path of files.keys()) {
    const match = path.match(CONTENT_PATH);
    if (match) dirs.set(`${match[1]}/${match[2]}`, { folder: match[1] as Folder, slug: match[2] });
  }

  const store: ContentStore = { pieces: [], series: [] };
  const ids = new Map<string, string>();

  for (const [dir, { folder, slug }] of [...dirs].sort(([a], [b]) => a.localeCompare(b))) {
    try {
      const type = FOLDERS[folder];
      const { meta, translations } = readDir(dir, files, type === "series" ? seriesMetaSchema : pieceMetaSchema);
      const owner = ids.get(meta.id);
      if (owner) throw new ContentError(`${dir}/meta.yml`, `id "${meta.id}" is already used by ${owner}`);
      ids.set(meta.id, dir);
      if (type === "series") store.series.push({ slug, meta: meta as SeriesMeta, translations });
      else store.pieces.push({ type, slug, meta, translations });
    } catch (error) {
      if (!(error instanceof ContentError)) throw error;
      errors.push({ path: error.path, message: error.message });
      invalidDirs.push(dir);
    }
  }

  // Series items must be article or post ids, each listed once. Unknown ids are
  // skipped rather than fatal, so deleting a piece never breaks its series.
  const pieceIds = new Set(store.pieces.map((p) => p.meta.id));
  store.series = store.series.filter((s) => {
    const path = `series/${s.slug}/meta.yml`;
    const duplicate = s.meta.items.find((id, i) => s.meta.items.indexOf(id) !== i);
    if (duplicate) {
      errors.push({ path, message: `item "${duplicate}" is listed more than once` });
      invalidDirs.push(`series/${s.slug}`);
      return false;
    }
    for (const id of s.meta.items) {
      if (!pieceIds.has(id)) warnings.push({ path, message: `unknown item "${id}" is skipped` });
    }
    return true;
  });

  return { store, errors, warnings, invalidDirs };
}

export function formatIssues(issues: ContentIssue[]): string {
  return issues.map(({ path, message }) => `${path}: ${message}`).join("\n");
}
