import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Layers } from "lucide-react";
import { Link } from "@/i18n/routing";
import { contentHref } from "@/lib/content/links";
import type { SeriesWithItems } from "@/lib/content/types";
import { formatDate } from "@/lib/content/format";
import { cn } from "@/lib/utils";
import ContentMeta from "./ContentMeta";
import Cover from "./Cover";
import TagList from "./TagList";
import { GlareSurface } from "./effects/Surfaces";

const PREVIEW_PARTS = 3;

export default function SeriesCollectionCard({ series }: { series: SeriesWithItems }) {
  const t = useTranslations("Archive.series");
  const common = useTranslations("Archive.common");
  const locale = useLocale();

  const articleCount = series.parts.filter((p) => p.type === "article").length;
  const postCount = series.parts.length - articleCount;
  const preview = series.parts.slice(0, PREVIEW_PARTS);
  const hidden = series.parts.length - preview.length;
  const first = series.parts[0];

  const composition = [
    articleCount > 0 && t("articles", { count: articleCount }),
    postCount > 0 && t("posts", { count: postCount }),
  ].filter(Boolean);

  return (
    <GlareSurface className="transition-transform duration-300 hover:-translate-y-1">
    <article className="group/card flex h-full flex-col overflow-hidden rounded-3xl">
      <div className="relative">
        <Cover
          src={series.cover}
          sizes="(min-width: 1024px) 580px, 100vw"
          className="aspect-21/9"
        />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm">
          <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
          {t("parts", { count: series.parts.length })}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <TagList tags={series.tags} />
        <h3 className="mt-2 text-xl font-extrabold leading-snug tracking-tight text-foreground">
          <Link href={`/series/${series.slug}`} className="transition-colors hover:text-primary">
            {series.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{series.summary}</p>

        <p className="mt-4 text-xs font-semibold text-foreground/80">
          {[...composition, common("readingTime", { minutes: series.readMinutes })].join(" · ")}
          <span className="font-normal text-muted-foreground">
            {" · "}
            {common("updated", { date: formatDate(series.updatedAt, locale) })}
          </span>
        </p>

        <ol className="mb-6 mt-4 flex flex-col gap-1 rounded-2xl bg-muted/50 p-2">
          {preview.map((part, index) => (
            <li key={part.id}>
              <Link
                href={contentHref(part, series.slug)}
                className="group/part flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-card"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-bold tabular-nums text-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover/part:text-primary">
                  {part.title}
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline",
                    part.type === "article" ? "bg-primary/10 text-primary" : "bg-foreground/5 text-muted-foreground"
                  )}
                >
                  {part.type === "article" ? common("typeArticle") : common("typePost")}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {common("minRead", { minutes: part.readMinutes })}
                </span>
              </Link>
            </li>
          ))}
          {hidden > 0 && (
            <li className="px-2 py-1.5 pl-12 text-xs font-medium text-muted-foreground">
              {t("moreParts", { count: hidden })}
            </li>
          )}
        </ol>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <ContentMeta views={series.views} rating={series.rating} ratingCount={series.ratingCount} />
          <div className="flex items-center gap-2">
            <Link
              href={`/series/${series.slug}`}
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {t("viewCta")}
            </Link>
            {first && (
              <Link
                href={contentHref(first, series.slug)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t("startCta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
    </GlareSurface>
  );
}
