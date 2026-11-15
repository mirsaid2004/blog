import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { NotesList } from "@/components/notes/NotesList";
import { getViewer } from "@/lib/auth";
import { listNotes } from "@/lib/notes/repo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Private notes: admin only, read from the content repo's notes/ folder. */
export default async function NotesPage() {
  const viewer = await getViewer();
  if (!viewer) return <AdminSignIn />;
  if (!viewer.isAdmin) notFound();

  const [notes, t] = await Promise.all([listNotes(), getTranslations("Notes")]);
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-24 pt-36 md:px-6">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} />
        Admin
      </Link>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t("intro")}</p>
      <NotesList notes={notes} />
    </main>
  );
}
