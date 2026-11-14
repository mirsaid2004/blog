import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import BlurText from "@/components/react-bits/BlurText";
import ContentMeta from "@/components/archive/ContentMeta";
import Cover from "@/components/archive/Cover";
import TagList from "@/components/archive/TagList";
import { contentHref } from "@/lib/content/links";
import { getContentBody } from "@/lib/content/mdx";
import type { SeriesContext } from "@/lib/content/queries";
import type { ContentItem } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import MobileToc from "./MobileToc";
import TableOfContents from "./TableOfContents";
import { mdxComponents } from "./mdx-components";
import { SeriesBanner, SeriesPager } from "./SeriesNav";
import { OtherLanguages, TranslationNotice } from "./TranslationNotice";

interface ContentDetailProps {
  /** Resolved for the reader's locale; `item.locale` is the language it's shown in. */
  item: ContentItem;
  /** Set when the piece was opened from a series (`?series=`). */
  seriesContext: SeriesContext | null;
  labels: {
    back: string;
    onThisPage: string;
    bodyMissing: string;
  };
}

/**
 * Shared layout for article and post detail pages: header, MDX body and the
 * "On this page" rail. Articles show their cover; posts are text-first.
 */
export default async function ContentDetail({ item, seriesContext, labels }: ContentDetailProps) {
  const body = await getContentBody(item.type, item.slug, item.locale, mdxComponents);
  const toc = body?.toc ?? [];
  const isArticle = item.type === "article";
  // This page's own path, so language links keep the reader in the same series.
  const selfHref = contentHref(item, seriesContext?.series.slug);
  const backHref = seriesContext ? `/series/${seriesContext.series.slug}` : isArticle ? "/articles" : "/posts";

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 md:px-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="mx-auto w-full max-w-3xl min-w-0">
          <header className="mb-10">
            {seriesContext ? (
              <SeriesBanner context={seriesContext} />
            ) : (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {labels.back}
              </Link>
            )}

            <TagList tags={item.tags} className="mt-8" />

            {/* BlurText renders a <p>; keep a real <h1> for document structure and assistive tech. */}
            <h1 className="sr-only" lang={item.locale}>
              {item.title}
            </h1>
            <div aria-hidden lang={item.locale}>
              <BlurText
                text={item.title}
                animateBy="words"
                direction="bottom"
                delay={60}
                trigger="load"
                className={cn(
                  "mt-4 font-extrabold leading-tight tracking-tight text-foreground",
                  isArticle ? "text-3xl md:text-5xl md:leading-tight" : "text-3xl md:text-4xl md:leading-tight"
                )}
              />
            </div>

            <p
              lang={item.locale}
              className="mt-5 text-lg leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-300 duration-700"
            >
              {item.summary}
            </p>

            <div className={cn("mt-6", !isArticle && "border-b border-border pb-8")}>
              <ContentMeta
                publishedAt={item.publishedAt}
                readMinutes={item.readMinutes}
                views={item.views}
                rating={item.rating}
                ratingCount={item.ratingCount}
                className="text-sm"
              />
              <OtherLanguages localized={item} href={selfHref} className="mt-4" />
            </div>

            {isArticle && (
              <Cover
                src={item.cover}
                alt=""
                sizes="(min-width: 768px) 768px, 100vw"
                priority
                className="mt-8 aspect-[2/1] rounded-2xl border border-border"
              />
            )}
          </header>

          <TranslationNotice kind={item.type} localized={item} href={selfHref} className="mb-8" />

          <MobileToc items={toc} title={labels.onThisPage} />

          {body ? (
            <div className="article-body" lang={item.locale}>
              {body.content}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
              {labels.bodyMissing}
            </p>
          )}

          {seriesContext && <SeriesPager context={seriesContext} />}
        </article>

        {toc.length > 0 && (
          <aside className="hidden xl:block">
            <TableOfContents
              items={toc}
              title={labels.onThisPage}
              className="sticky top-28 max-h-[calc(100vh-8rem)]"
            />
          </aside>
        )}
      </div>
    </main>
  );
}
