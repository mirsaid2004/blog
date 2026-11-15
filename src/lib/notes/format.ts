import type { Locale } from "next-intl";
import { parse as parseYaml, stringify } from "yaml";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { isLocale, newId } from "@/lib/editor/format";

/**
 * Private notes (PLAN.md 2.7): `notes/<slug>/meta.yml` plus one
 * `<locale>.mdx` per language in the content repo. The public sync only reads
 * articles/, posts/ and series/, so notes never reach the site's index. They
 * have no status, ratings or views, and are committed straight to main.
 */

export const NOTES_DIR = "notes";
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*(?:\r?\n|$)/;
const YAML = { lineWidth: 0 } as const;

export const noteMetaSchema = z.strictObject({
  id: z.string().min(1),
  originalLocale: z.enum(routing.locales),
  tags: z.array(z.string().min(1)).default([]),
});

export const noteTranslationSchema = z.strictObject({ title: z.string().min(1) });

export interface NoteDoc {
  meta: { id: string; originalLocale: Locale; tags: string[] };
  translations: Partial<Record<Locale, { title: string; body: string }>>;
}

export type NoteFiles = Record<string, string>;

function safeYaml(text: string): Record<string, unknown> {
  try {
    const value = parseYaml(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

/** Lenient: a hand-edited file may be invalid; the editor is where it gets fixed. */
export function parseNote(files: NoteFiles, fallbackLocale: Locale): NoteDoc {
  const meta = safeYaml(files["meta.yml"] ?? "");
  const translations: NoteDoc["translations"] = {};
  for (const locale of routing.locales) {
    const text = files[`${locale}.mdx`];
    if (text === undefined) continue;
    const match = text.match(FRONTMATTER);
    const front = match ? safeYaml(match[1]) : {};
    translations[locale] = {
      title: typeof front.title === "string" ? front.title : "",
      body: (match ? text.slice(match[0].length) : text).trim(),
    };
  }
  return {
    meta: {
      id: typeof meta.id === "string" ? meta.id : "",
      originalLocale: isLocale(meta.originalLocale) ? meta.originalLocale : fallbackLocale,
      tags: Array.isArray(meta.tags) ? meta.tags.map(String).filter(Boolean) : [],
    },
    translations,
  };
}

export function serializeNote(doc: NoteDoc): NoteFiles {
  const files: NoteFiles = {
    "meta.yml": stringify({ id: doc.meta.id, originalLocale: doc.meta.originalLocale, tags: doc.meta.tags }, YAML),
  };
  for (const locale of routing.locales) {
    const t = doc.translations[locale];
    if (!t) continue;
    const body = t.body.trim();
    files[`${locale}.mdx`] = `---\n${stringify({ title: t.title }, YAML)}---\n${body ? `\n${body}\n` : ""}`;
  }
  return files;
}

export function newNote(originalLocale: Locale): NoteDoc {
  return { meta: { id: newId(), originalLocale, tags: [] }, translations: { [originalLocale]: { title: "", body: "" } } };
}

/** Problems that would make the note unreadable later; saving is refused while there are any. */
export function noteIssues(files: NoteFiles): string[] {
  const issues: string[] = [];
  const meta = noteMetaSchema.safeParse(safeYaml(files["meta.yml"] ?? ""));
  if (!meta.success) issues.push(`meta.yml: ${z.prettifyError(meta.error)}`);
  for (const [name, text] of Object.entries(files)) {
    if (name === "meta.yml") continue;
    const match = text.match(FRONTMATTER);
    const front = noteTranslationSchema.safeParse(match ? safeYaml(match[1]) : {});
    if (!front.success) issues.push(`${name}: ${z.prettifyError(front.error)}`);
  }
  if (meta.success && files[`${meta.data.originalLocale}.mdx`] === undefined) {
    issues.push(`${meta.data.originalLocale}.mdx: the original-language file is missing`);
  }
  return issues;
}
