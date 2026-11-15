import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { parseContent, type ContentIssue } from "@/lib/content/parse";
import { kindOf, type Folder, type PieceFiles } from "./format";

/**
 * Checks a piece the way the sync will, plus what only the whole site can tell:
 * that its id isn't used by another piece and that a series lists real articles
 * and posts. Publishing is refused while there are errors.
 */
export async function validatePiece(
  folder: Folder,
  slug: string,
  files: PieceFiles
): Promise<{ errors: ContentIssue[]; warnings: ContentIssue[] }> {
  const map = new Map(Object.entries(files).map(([name, text]) => [`${folder}/${slug}/${name}`, text]));
  const { store, errors, warnings } = parseContent(map);
  const piece = store.pieces[0] ?? store.series[0];
  if (!piece) return { errors, warnings: [] };

  const kind = kindOf(folder);
  const { contentItems } = schema;
  const metaPath = `${folder}/${slug}/meta.yml`;

  const [clash] = await db()
    .select({ kind: contentItems.kind, slug: contentItems.slug })
    .from(contentItems)
    .where(and(eq(contentItems.id, piece.meta.id), or(ne(contentItems.kind, kind), ne(contentItems.slug, slug))))
    .limit(1);
  if (clash) errors.push({ path: metaPath, message: `id "${piece.meta.id}" is already used by ${clash.kind} "${clash.slug}"` });

  // parseContent only saw this one piece, so it flagged every series item as unknown.
  if (kind === "series" && "items" in piece.meta) {
    const ids = (piece.meta as { items: string[] }).items;
    const found = await db()
      .select({ id: contentItems.id, kind: contentItems.kind })
      .from(contentItems)
      .where(inArray(contentItems.id, ids));
    const kinds = new Map(found.map((r) => [r.id, r.kind]));
    const rest = warnings.filter((w) => !w.message.startsWith("unknown item"));
    for (const id of ids) {
      const itemKind = kinds.get(id);
      if (!itemKind) rest.push({ path: metaPath, message: `unknown item "${id}" will be skipped` });
      else if (itemKind === "series") errors.push({ path: metaPath, message: `item "${id}" is a series; series can't nest` });
    }
    return { errors, warnings: rest };
  }
  return { errors, warnings };
}
