import { z } from "zod";
import { routing } from "@/i18n/routing";

/**
 * Schemas for the files in the content repo (see parse.ts). The sync and the
 * editor (PLAN.md phase 5) both validate with them, so a malformed file is
 * rejected before it can break a page.
 */

const locale = z.enum(routing.locales);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected a YYYY-MM-DD date");

/** `meta.yml` of an article or post: fields shared by every language. */
export const pieceMetaSchema = z.strictObject({
  /** Stable id. Never changes, even if the slug does. */
  id: z.string().min(1),
  /** The language it was written in; the fallback when the reader's language is missing. */
  originalLocale: locale,
  publishedAt: isoDate,
  tags: z.array(z.string().min(1)).default([]),
  cover: z.string().min(1).optional(),
});

/** `meta.yml` of a series. `items` holds article and post ids in reading order. */
export const seriesMetaSchema = pieceMetaSchema.extend({
  items: z.array(z.string().min(1)).min(1),
});

/** Frontmatter of `<locale>.mdx`: what differs per language. */
export const translationSchema = z.strictObject({
  title: z.string().min(1),
  summary: z.string().min(1),
  /** Each language is published independently; a draft shows as "coming soon". */
  status: z.enum(["draft", "published"]),
  /**
   * Git blob sha of the original-language file this translation is up to date
   * with. When the original changes, its sha differs and the editor flags the
   * translation as possibly outdated. Unset on the original itself.
   */
  translatedFrom: z
    .string()
    .regex(/^[0-9a-f]{40}$/, "expected a 40-character git sha")
    .optional(),
});

export type PieceMeta = z.infer<typeof pieceMetaSchema>;
export type SeriesMeta = z.infer<typeof seriesMetaSchema>;
export type TranslationFrontmatter = z.infer<typeof translationSchema>;
