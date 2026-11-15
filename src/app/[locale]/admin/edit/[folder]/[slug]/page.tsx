import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import Editor from "@/components/editor/Editor";
import type { PickablePiece } from "@/components/editor/SeriesItems";
import { getViewer } from "@/lib/auth";
import { loadContent } from "@/lib/content/source";
import { draftBranch, FOLDERS, isLocale, SLUG, type Folder } from "@/lib/editor/format";
import { branchHead, MAIN, mainChangesSince, readPiece } from "@/lib/editor/repo";

export const metadata: Metadata = { title: "Editor", robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ locale: Locale; folder: string; slug: string }>;
  searchParams: Promise<{ lang?: string; published?: string }>;
}

async function pickablePieces(): Promise<PickablePiece[]> {
  const { pieces } = await loadContent();
  return pieces.map((p) => ({
    id: p.meta.id,
    kind: p.type,
    slug: p.slug,
    title: p.translations[p.meta.originalLocale]?.title ?? p.slug,
    published: Object.values(p.translations).some((t) => t?.status === "published"),
  }));
}

/**
 * The editor for one piece. It opens the piece's draft branch if there is one,
 * else the published version on main; a new piece (from /admin/new) has neither.
 */
export default async function EditPage({ params, searchParams }: PageProps) {
  const [{ folder, slug }, { lang, published }] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  if (!viewer) return <AdminSignIn />;
  if (!viewer.isAdmin) notFound();
  if (!FOLDERS.includes(folder as Folder) || !SLUG.test(slug)) notFound();

  const branch = draftBranch(folder as Folder, slug);
  const head = await branchHead(branch);
  const [draftFiles, mainFiles, mainChanges, pieces] = await Promise.all([
    head ? readPiece(folder as Folder, slug, head) : null,
    readPiece(folder as Folder, slug, MAIN),
    head ? mainChangesSince(branch, folder as Folder, slug) : [],
    folder === "series" ? pickablePieces() : [],
  ]);
  const files = draftFiles ?? mainFiles;
  // Neither a draft nor a published piece: only a new piece (with its language) may start here.
  if (Object.keys(files).length === 0 && !isLocale(lang)) notFound();

  return (
    <Editor
      key={head ?? MAIN}
      folder={folder as Folder}
      slug={slug}
      head={head}
      files={files}
      mainFiles={mainFiles}
      initialLocale={isLocale(lang) ? lang : "en"}
      mainChanges={mainChanges}
      pieces={pieces}
      justPublished={published === "1"}
    />
  );
}
