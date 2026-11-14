import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { count, eq } from "drizzle-orm";
import { SyncButton } from "@/components/admin/SyncButton";
import { MobileUserMenu } from "@/components/auth/UserMenu";
import { getViewer } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

function formatDateTime(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Admin dashboard. The admin check runs here on the server for every request:
 * signed-out visitors get a sign-in prompt, signed-in readers a 404.
 */
export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-24 pt-36">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("signInRequired")}</p>
        <MobileUserMenu />
      </main>
    );
  }
  if (!viewer.isAdmin) notFound();

  const [[sync], [{ items }]] = await Promise.all([
    db().select().from(schema.contentSync).where(eq(schema.contentSync.id, 1)),
    db().select({ items: count() }).from(schema.contentItems),
  ]);
  const repo = process.env.GITHUB_CONTENT_REPO ?? "";

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-24 pt-36 md:px-6">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">{t("title")}</h1>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <h2 className="mb-4 text-lg font-bold">{t("contentTitle")}</h2>
        <dl className="mb-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted-foreground">{t("contentRepo")}</dt>
          <dd>
            <a href={`https://github.com/${repo}`} className="font-medium text-primary hover:underline" target="_blank" rel="noreferrer">
              {repo}
            </a>
          </dd>
          <dt className="text-muted-foreground">{t("lastSync")}</dt>
          <dd>{sync ? formatDateTime(sync.syncedAt, locale) : t("never")}</dd>
          {sync && (
            <>
              <dt className="text-muted-foreground">{t("commit")}</dt>
              <dd>
                <a
                  href={`https://github.com/${repo}/commit/${sync.commitSha}`}
                  className="font-mono text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {sync.commitSha.slice(0, 7)}
                </a>
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">{t("items")}</dt>
          <dd>{items}</dd>
        </dl>

        <h3 className="mb-2 text-sm font-semibold">{t("rejected")}</h3>
        {sync?.errors.length ? (
          <ul className="mb-6 space-y-2">
            {sync.errors.map((error) => (
              <li key={error.path} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-mono text-xs font-semibold">{error.path}</p>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{error.message}</pre>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">{t("noRejected")}</p>
        )}

        <SyncButton />
      </section>
    </main>
  );
}
