import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowLeft, EyeOff } from "lucide-react";
import { Link } from "@/i18n/routing";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { ViewsChart } from "@/components/admin/ViewsChart";
import { CommentActions } from "@/components/engagement/CommentControls";
import { loadAnalytics, WINDOW_DAYS, type PieceRef } from "@/lib/analytics";
import { getViewer } from "@/lib/auth";
import { formatRating } from "@/lib/content/format";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const href = (p: PieceRef) => `/${p.kind === "series" ? "series" : `${p.kind}s`}/${p.slug}`;

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border/60 bg-card/60 p-6 ${className ?? ""}`}>
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const viewer = await getViewer();
  if (!viewer) return <AdminSignIn />;
  if (!viewer.isAdmin) notFound();

  const [data, t, format] = await Promise.all([loadAnalytics(), getTranslations("Analytics"), getFormatter()]);
  const number = (n: number) => format.number(n);
  const localeMax = Math.max(1, ...data.byLocale.map((l) => l.views));

  const tiles = [
    { label: t("viewsWindow", { days: WINDOW_DAYS }), value: number(data.totals.viewsWindow) },
    { label: t("viewsAllTime"), value: number(data.totals.views) },
    {
      label: t("ratings"),
      value: number(data.totals.ratings),
      note: data.totals.averageRating === null ? undefined : t("average", { rating: formatRating(data.totals.averageRating, locale) }),
    },
    { label: t("comments"), value: number(data.totals.comments) },
    { label: t("readers"), value: number(data.totals.readers) },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-36 md:px-6">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} />
        Admin
      </Link>
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">{t("title")}</h1>

      <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <dt className="text-xs font-medium text-muted-foreground">{tile.label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{tile.value}</dd>
            {tile.note && <dd className="text-xs text-muted-foreground">{tile.note}</dd>}
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title={t("dailyViews", { days: WINDOW_DAYS })} className="lg:col-span-2">
          <ViewsChart
            data={data.daily}
            locale={locale}
            label={t("dailyViews", { days: WINDOW_DAYS })}
            valueLabel={(views) => t("viewCount", { count: views })}
          />
        </Section>

        <Section title={t("byLanguage")}>
          {data.byLocale.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          ) : (
            <ul className="space-y-3">
              {data.byLocale.map((l) => (
                <li key={l.locale}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{l.locale.toUpperCase()}</span>
                    <span className="tabular-nums text-muted-foreground">{number(l.views)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(l.views / localeMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("topViewed", { days: WINDOW_DAYS })} className="lg:col-span-2">
          {data.topViewed.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.topViewed.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3">
                      <Link href={href(p)} className="font-medium hover:text-primary">
                        {p.title}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">{t("kind", { kind: p.kind })}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{number(p.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title={t("topRated")}>
          {data.topRated.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRatings")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topRated.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <Link href={href(p)} className="truncate font-medium hover:text-primary">
                    {p.title}
                  </Link>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    ★ {formatRating(p.average, locale)} ({p.count})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("recentComments")} className="lg:col-span-3">
          {data.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noComments")}</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {data.comments.map((c) => (
                <li key={c.id} className={`py-3 ${c.hidden ? "opacity-60" : ""}`}>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.author.name}</span>
                    <span>{format.dateTime(new Date(c.createdAt), { dateStyle: "medium", timeStyle: "short" })}</span>
                    {c.piece && (
                      <Link href={`${href(c.piece)}#comment-${c.id}`} className="text-primary hover:underline">
                        {c.piece.title}
                      </Link>
                    )}
                    <span>{c.locale.toUpperCase()}</span>
                    {c.hidden && (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <EyeOff size={12} />
                        {t("hidden")}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm">{c.body}</p>
                  <CommentActions id={c.id} canDelete canHide hidden={c.hidden} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}
