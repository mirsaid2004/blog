import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import NoteEditor from "@/components/notes/NoteEditor";
import { getViewer } from "@/lib/auth";
import { isLocale, SLUG } from "@/lib/editor/format";
import { readNote } from "@/lib/notes/repo";

export const metadata: Metadata = { title: "Note", robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function NotePage({ params, searchParams }: PageProps) {
  const [{ slug }, { lang }] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  if (!viewer) return <AdminSignIn />;
  if (!viewer.isAdmin) notFound();
  if (!SLUG.test(slug)) notFound();

  const { files, shas } = await readNote(slug);
  // A note that doesn't exist yet can only be started from the notes list (with its language).
  if (Object.keys(files).length === 0 && !isLocale(lang)) notFound();

  return (
    <NoteEditor
      key={JSON.stringify(shas)}
      slug={slug}
      files={files}
      shas={shas}
      initialLocale={isLocale(lang) ? lang : "en"}
    />
  );
}
