import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Clock, Layers } from "lucide-react";
import { Link, routing } from "@/i18n/routing";
import BlurText from "@/components/react-bits/BlurText";
import ContentMeta from "@/components/archive/ContentMeta";
import Cover from "@/components/archive/Cover";
import Reveal from "@/components/archive/Reveal";
import TagList from "@/components/archive/TagList";
import { formatDate } from "@/lib/content/format";
import { contentHref } from "@/lib/content/links";
import { getSeries, getSeriesBySlug } from "@/lib/content/queries";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

/**
 * Every slug in every locale. Also makes `next build` read and validate content/,
 * so a malformed file fails the build instead of a request.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getSeries(locale).map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const series = getSeriesBySlug(slug, locale);
  if (!series) return {};
  return { title: series.title, description: series.summary };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const series = getSeriesBySlug(slug, locale);
  if (!series) notFound();

  const t = await getTranslations("SeriesDetail");
  const archive = await getTranslations("Archive.series");
  const common = await getTranslations("Archive.common");

  const articleCount = series.parts.filter((p) => p.type === "article").length;
  const postCount = series.parts.length - articleCount;
  const composition = [
    articleCount > 0 && archive("articles", { count: articleCount }),
    postCount > 0 && archive("posts", { count: postCount }),
    common("readingTime", { minutes: series.readMinutes }),
  ].filter(Boolean);
  const first = series.parts[0];

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <header className="mb-12">
          <Link
            href="/series"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("backToSeries")}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-background/60 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-md">
              <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
              {archive("parts", { count: series.parts.length })}
            </span>
            <TagList tags={series.tags} />
          </div>

          {/* BlurText renders a <p>; keep a real <h1> for document structure and assistive tech. */}
          <h1 className="sr-only">{series.title}</h1>
          <div aria-hidden>
            <BlurText
              text={series.title}
              animateBy="words"
              direction="bottom"
              delay={60}
              trigger="load"
              className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl md:leading-tight"
            />
          </div>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-300 duration-700">
            {series.summary}
          </p>

          <p className="mt-6 text-sm font-semibold text-foreground/80">
            {composition.join(" · ")}
            <span className="font-normal text-muted-foreground">
              {" · "}
              {common("updated", { date: formatDate(series.updatedAt, locale) })}
            </span>
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <ContentMeta views={series.views} rating={series.rating} ratingCount={series.ratingCount} className="text-sm" />
            {first && (
              <Link
                href={contentHref(first, series.slug)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {archive("startCta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>

          <Cover
            src={series.cover}
            alt=""
            sizes="(min-width: 896px) 896px, 100vw"
            priority
            className="mt-8 aspect-21/9 rounded-2xl border border-border"
          />
        </header>

        <section aria-labelledby="reading-order">
          <h2 id="reading-order" className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary">
            {t("readingOrder")}
          </h2>

          {/* A rail connects the numbered parts, echoing the "On this page" track. */}
          <ol className="relative flex flex-col gap-4 before:absolute before:bottom-6 before:left-5 before:-translate-x-1/2 before:top-6 before:w-px before:bg-border">
            {series.parts.map((part, index) => (
              <li key={part.id}>
                <Reveal index={index}>
                  <div className="group relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4">
                    <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-sm font-bold tabular-nums text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                      {index + 1}
                    </span>
                    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-md transition-colors group-hover:border-primary/40">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            part.type === "article" ? "bg-primary/10 text-primary" : "bg-foreground/5 text-muted-foreground"
                          )}
                        >
                          {part.type === "article" ? common("typeArticle") : common("typePost")}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {common("minRead", { minutes: part.readMinutes })}
                        </span>
                        <time dateTime={part.publishedAt} className="tabular-nums">
                          {formatDate(part.publishedAt, locale)}
                        </time>
                      </div>
                      <h3 className="mt-2 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        <Link href={contentHref(part, series.slug)} className="after:absolute after:inset-0">
                          {part.title}
                        </Link>
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{part.summary}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
