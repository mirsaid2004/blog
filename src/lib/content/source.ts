import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
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
 * Reads content/ — the local stand-in for the GitHub content repo (see PLAN.md):
 *
 *   content/<articles|posts|series>/<slug>/meta.yml      shared by every language
 *   content/<articles|posts|series>/<slug>/<locale>.mdx  one file per language
 *
 * The folder gives the type and slug. Every file is validated, so a typo fails
 * loudly with the file's path instead of rendering a broken page.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");
const WORDS_PER_MINUTE = 200;

export interface Translation extends TranslationFrontmatter {
  /** MDX body without frontmatter. */
  body: string;
  readMinutes: number;
}

type Translations = Partial<Record<Locale, Translation>>;

export interface PieceSource {
  type: ContentType;
  slug: string;
  meta: PieceMeta;
  translations: Translations;
}

export interface SeriesSource {
  slug: string;
  meta: SeriesMeta;
  translations: Translations;
}

export interface ContentStore {
  pieces: PieceSource[];
  series: SeriesSource[];
}

const FOLDERS = { articles: "article", posts: "post" } as const satisfies Record<string, ContentType>;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*(?:\r?\n|$)/;

class ContentError extends Error {
  constructor(file: string, message: string) {
    super(`${path.relative(process.cwd(), file)}: ${message}`);
    this.name = "ContentError";
  }
}

function validate<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ContentError(file, `\n${z.prettifyError(result.error)}`);
  return result.data;
}

function parseYamlIn(text: string, file: string): unknown {
  try {
    return parseYaml(text);
  } catch (error) {
    throw new ContentError(file, (error as Error).message);
  }
}

const readYaml = (file: string) => parseYamlIn(fs.readFileSync(file, "utf8"), file);

function readMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function readTranslations(dir: string, originalLocale: Locale): Translations {
  const translations: Translations = {};
  for (const locale of routing.locales) {
    const file = path.join(dir, `${locale}.mdx`);
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const match = source.match(FRONTMATTER);
    if (!match) throw new ContentError(file, "missing frontmatter (title, summary, status)");
    const frontmatter = validate(translationSchema, parseYamlIn(match[1], file), file);
    const body = source.slice(match[0].length).trim();
    translations[locale] = { ...frontmatter, body, readMinutes: readMinutes(body) };
  }
  if (!translations[originalLocale]) {
    throw new ContentError(path.join(dir, `${originalLocale}.mdx`), "the original-language file is missing");
  }
  return translations;
}

function slugDirs(folder: string): string[] {
  const dir = path.join(CONTENT_ROOT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readAll(): ContentStore {
  const pieces: PieceSource[] = [];
  for (const [folder, type] of Object.entries(FOLDERS)) {
    for (const slug of slugDirs(folder)) {
      const dir = path.join(CONTENT_ROOT, folder, slug);
      const metaFile = path.join(dir, "meta.yml");
      const meta = validate(pieceMetaSchema, readYaml(metaFile), metaFile);
      pieces.push({ type, slug, meta, translations: readTranslations(dir, meta.originalLocale) });
    }
  }

  const series: SeriesSource[] = [];
  for (const slug of slugDirs("series")) {
    const dir = path.join(CONTENT_ROOT, "series", slug);
    const metaFile = path.join(dir, "meta.yml");
    const meta = validate(seriesMetaSchema, readYaml(metaFile), metaFile);
    series.push({ slug, meta, translations: readTranslations(dir, meta.originalLocale) });
  }

  checkIds(pieces, series);
  return { pieces, series };
}

/** Ids must be unique; series items must be article or post ids, listed once. */
function checkIds(pieces: PieceSource[], series: SeriesSource[]) {
  const seen = new Map<string, string>();
  const claim = (id: string, where: string) => {
    const previous = seen.get(id);
    if (previous) throw new Error(`Duplicate content id "${id}" in ${previous} and ${where}`);
    seen.set(id, where);
  };
  pieces.forEach((p) => claim(p.meta.id, `content/${p.type}s/${p.slug}`));
  series.forEach((s) => claim(s.meta.id, `content/series/${s.slug}`));

  const pieceIds = new Set(pieces.map((p) => p.meta.id));
  for (const s of series) {
    const file = path.join(CONTENT_ROOT, "series", s.slug, "meta.yml");
    const duplicate = s.meta.items.find((id, i) => s.meta.items.indexOf(id) !== i);
    if (duplicate) throw new ContentError(file, `item "${duplicate}" is listed more than once`);
    // Unknown ids are skipped rather than fatal, so deleting a piece never breaks the build.
    for (const id of s.meta.items) {
      if (!pieceIds.has(id)) {
        console.warn(`${path.relative(process.cwd(), file)}: unknown item "${id}" is skipped`);
      }
    }
  }
}

// Production reads content once per process. In development it re-reads on each
// request (deduped within a request), so edits to content/ show up on refresh.
let store: ContentStore | undefined;
const readPerRequest = cache(readAll);

export function loadContent(): ContentStore {
  if (process.env.NODE_ENV === "development") return readPerRequest();
  return (store ??= readAll());
}
