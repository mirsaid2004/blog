import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import ContentDetail from "@/components/article/ContentDetail";
import { firstParam, getArticleBySlug, getSeriesContext } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.summary };
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const t = await getTranslations("Article");
  const seriesContext = getSeriesContext(article.id, firstParam((await searchParams).series));

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
