import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { Link } from "@/i18n/routing";
import { contentHref } from "@/lib/content/links";
import type { SeriesContext } from "@/lib/content/queries";
import { cn } from "@/lib/utils";

/** "Part 2 of 4 · <series>" with a segmented progress bar, shown above the title. */
export function SeriesBanner({ context, className }: { context: SeriesContext; className?: string }) {
  const t = useTranslations("SeriesNav");
  const { series, index } = context;

  return (
    <Link
      href={`/series/${series.slug}`}
      className={cn(
        "group flex flex-col gap-2.5 rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md transition-colors hover:border-primary/40",
        className
      )}
    >
      <span className="flex items-center gap-2 text-sm">
        <Layers className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="font-semibold tabular-nums text-foreground">
          {t("partOf", { current: index + 1, total: series.parts.length })}
        </span>
        <span aria-hidden className="text-muted-foreground">·</span>
        <span className="min-w-0 truncate text-muted-foreground transition-colors group-hover:text-foreground">
          {series.title}
        </span>
      </span>
      <span aria-hidden className="flex gap-1">
        {series.parts.map((part, i) => (
          <span
            key={part.id}
            className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-primary" : "bg-foreground/10")}
          />
        ))}
      </span>
    </Link>
  );
}

/** Previous / next part links at the end of a piece read inside a series. */
export function SeriesPager({ context }: { context: SeriesContext }) {
  const t = useTranslations("SeriesNav");
  const { series, prev, next } = context;

  return (
    <nav aria-label={t("label", { title: series.title })} className="mt-16 border-t border-border pt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={contentHref(prev, series.slug)}
            className="group flex flex-col gap-1 rounded-2xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-card/60"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {t("previous")}
            </span>
            <span className="font-semibold leading-snug text-foreground group-hover:text-primary">{prev.title}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}

        {next ? (
          <Link
            href={contentHref(next, series.slug)}
            className="group flex flex-col gap-1 rounded-2xl border border-border p-4 text-right transition-colors hover:border-primary/40 hover:bg-card/60"
          >
            <span className="flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("next")}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="font-semibold leading-snug text-foreground group-hover:text-primary">{next.title}</span>
          </Link>
        ) : (
          <Link
            href={`/series/${series.slug}`}
            className="group flex flex-col gap-1 rounded-2xl border border-dashed border-border p-4 text-right transition-colors hover:border-primary/40"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("finished")}</span>
            <span className="font-semibold leading-snug text-foreground group-hover:text-primary">{t("backToSeries")}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
