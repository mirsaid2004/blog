import { getTranslations } from "next-intl/server";
import { GitBranch, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import type { CellStatus, Overview } from "@/lib/editor/overview";
import { cn } from "@/lib/utils";

const CELL: Record<CellStatus, string> = {
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  draft: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  outdated: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  missing: "text-muted-foreground/60",
};

/** Translation matrix: one row per piece, one column per language. */
export async function ContentTable({ overview }: { overview: Overview }) {
  const t = await getTranslations("Editor");

  return (
    <section className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t("contentList")}</h2>
        <Link
          href="/admin/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          {t("newPiece")}
        </Link>
      </div>

      {overview.newDrafts.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">{t("newDrafts")}</h3>
          <ul className="flex flex-wrap gap-2">
            {overview.newDrafts.map(({ folder, slug }) => (
              <li key={`${folder}/${slug}`}>
                <Link
                  href={`/admin/edit/${folder}/${slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 font-mono text-xs hover:border-primary/50 hover:text-primary"
                >
                  <GitBranch size={13} />
                  {folder}/{slug}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4 font-semibold">{t("piece")}</th>
              <th className="py-2 pr-4 font-semibold">{t("type")}</th>
              {routing.locales.map((locale) => (
                <th key={locale} className="w-20 py-2 pr-2 text-center font-semibold">
                  {locale.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {overview.rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 pr-4">
                  <Link href={`/admin/edit/${row.folder}/${row.slug}`} className="font-medium hover:text-primary">
                    {row.title || row.slug}
                  </Link>
                  {row.hasDraft && (
                    <span
                      title={t("hasDraft")}
                      className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 align-middle text-[11px] font-medium text-primary"
                    >
                      <GitBranch size={11} />
                      {t("draftBadge")}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground">{t("kind", { kind: row.kind })}</td>
                {routing.locales.map((locale) => {
                  const status: CellStatus = row.languages[locale] ?? "missing";
                  return (
                    <td key={locale} className="py-2.5 pr-2 text-center">
                      <span
                        className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", CELL[status])}
                        title={locale === row.originalLocale ? t("original") : undefined}
                      >
                        {t("cell", { status })}
                        {locale === row.originalLocale && " ★"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
