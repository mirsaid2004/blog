import { sql } from "drizzle-orm";
import type { Locale } from "next-intl";
import { db } from "@/lib/db";
import { folderOf, type Folder, type PieceKind } from "./format";
import { listDrafts } from "./repo";

/**
 * The admin content list: every indexed piece with a status per language (the
 * translation matrix), plus open draft branches, including drafts of pieces
 * that aren't on main yet.
 */

export type CellStatus = "published" | "draft" | "outdated" | "missing";

export interface OverviewRow {
  id: string;
  kind: PieceKind;
  folder: Folder;
  slug: string;
  title: string;
  originalLocale: Locale;
  languages: Partial<Record<Locale, Exclude<CellStatus, "missing">>>;
  hasDraft: boolean;
}

export interface Overview {
  rows: OverviewRow[];
  /** Drafts of pieces not on main yet. */
  newDrafts: { folder: Folder; slug: string }[];
}

interface Row extends Record<string, unknown> {
  id: string;
  kind: PieceKind;
  slug: string;
  original_locale: Locale;
  locale: Locale;
  title: string;
  status: "draft" | "published";
  translated_from: string | null;
  original_sha: string | null;
}

export async function loadOverview(): Promise<Overview> {
  // A translation is outdated when the original file's current blob sha on main
  // differs from the one it was last brought up to date with (translatedFrom).
  const [{ rows: result }, drafts] = await Promise.all([
    db().execute<Row>(sql`
      select i.id, i.kind, i.slug, i.original_locale, t.locale, t.title, t.status, t.translated_from,
             f.sha as original_sha
      from content_items i
      join content_translations t on t.item_id = i.id
      left join content_files f on f.path = (case i.kind when 'series' then 'series' else i.kind || 's' end)
                                          || '/' || i.slug || '/' || i.original_locale || '.mdx'
      order by i.published_at desc, i.slug`),
    listDrafts(),
  ]);

  const draftKeys = new Set(drafts.map((d) => `${d.folder}/${d.slug}`));
  const rows = new Map<string, OverviewRow>();
  for (const r of result) {
    const folder = folderOf(r.kind);
    const row =
      rows.get(r.id) ??
      ({
        id: r.id,
        kind: r.kind,
        folder,
        slug: r.slug,
        title: "",
        originalLocale: r.original_locale,
        languages: {},
        hasDraft: draftKeys.has(`${folder}/${r.slug}`),
      } satisfies OverviewRow);
    if (r.locale === r.original_locale || !row.title) row.title = r.title;
    const outdated =
      r.locale !== r.original_locale && r.translated_from !== null && r.original_sha !== null && r.translated_from !== r.original_sha;
    row.languages[r.locale] = outdated ? "outdated" : r.status;
    rows.set(r.id, row);
  }

  const indexed = new Set([...rows.values()].map((r) => `${r.folder}/${r.slug}`));
  return {
    rows: [...rows.values()],
    newDrafts: drafts.filter((d) => !indexed.has(`${d.folder}/${d.slug}`)).map(({ folder, slug }) => ({ folder, slug })),
  };
}
