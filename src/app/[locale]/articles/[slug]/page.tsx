import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Info } from "lucide-react";
import { Link } from "@/i18n/routing";
import BlurText from "@/components/react-bits/BlurText";
import ContentMeta from "@/components/archive/ContentMeta";
import Cover from "@/components/archive/Cover";
import TagList from "@/components/archive/TagList";
import MobileToc from "@/components/article/MobileToc";
import TableOfContents from "@/components/article/TableOfContents";
import { mdxComponents } from "@/components/article/mdx-components";
import { getContentBody } from "@/lib/content/mdx";
import { getArticleBySlug } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.summary };
}

export default async function ArticlePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const t = await getTranslations("Article");
  const body = await getContentBody("article", slug, locale, mdxComponents);
  const toc = body?.toc ?? [];

  return (
    <main className="relative min-h-screen pb-24 pt-32 md:pt-36">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 md:px-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="mx-auto w-full max-w-3xl min-w-0">
          <header className="mb-10">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("backToArticles")}
            </Link>

            <TagList tags={article.tags} className="mt-8" />

            {/* BlurText renders a <p>; keep a real <h1> for document structure and assistive tech. */}
            <h1 className="sr-only">{article.title}</h1>
            <div aria-hidden>
              <BlurText
                text={article.title}
                animateBy="words"
                direction="bottom"
                delay={60}
                trigger="load"
                className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl md:leading-tight"
              />
            </div>

            <p className="mt-5 text-lg leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-300 duration-700">
              {article.summary}
            </p>

            <ContentMeta
              publishedAt={article.publishedAt}
              readMinutes={article.readMinutes}
              views={article.views}
              rating={article.rating}
              ratingCount={article.ratingCount}
              className="mt-6 text-sm"
            />

            <Cover
              src={article.cover}
              alt=""
              sizes="(min-width: 768px) 768px, 100vw"
              priority
              className="mt-8 aspect-[2/1] rounded-2xl border border-border"
            />
          </header>

          <MobileToc items={toc} title={t("onThisPage")} />

          {body && body.locale !== locale && (
            <p className="mb-8 flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t("fallbackNotice")}
            </p>
          )}

          {body ? (
            <div className="article-body" lang={body.locale}>
              {body.content}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
              {t("bodyMissing")}
            </p>
          )}
        </article>

        {toc.length > 0 && (
          <aside className="hidden xl:block">
            <TableOfContents
              items={toc}
              title={t("onThisPage")}
              className="sticky top-28 max-h-[calc(100vh-8rem)]"
            />
          </aside>
        )}
      </div>
    </main>
  );
}
