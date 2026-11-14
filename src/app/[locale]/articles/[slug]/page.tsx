import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import ContentDetail from "@/components/article/ContentDetail";
import { firstParam, getArticleBySlug, getArticles, getSeriesContext } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Every slug in every locale. Also makes `next build` read and validate content/,
 * so a malformed file fails the build instead of a request.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getArticles(locale).map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug, locale);
  if (!article) return {};
  return { title: article.title, description: article.summary };
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug, locale);
  if (!article) notFound();

  const t = await getTranslations("Article");
  const seriesContext = getSeriesContext(article.id, firstParam((await searchParams).series), locale);

  return (
    <ContentDetail
      item={article}
      locale={locale}
      seriesContext={seriesContext}
      labels={{
        back: t("backToArticles"),
        onThisPage: t("onThisPage"),
        bodyMissing: t("bodyMissing"),
        fallbackNotice: t("fallbackNotice"),
      }}
    />
  );
}
