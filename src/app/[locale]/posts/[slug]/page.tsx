import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import ContentDetail from "@/components/article/ContentDetail";
import { firstParam, getPostBySlug, getSeriesContext } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function PostPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("Post");
  const seriesContext = getSeriesContext(post.id, firstParam((await searchParams).series));

  return (
    <ContentDetail
      item={post}
      locale={locale}
      seriesContext={seriesContext}
      labels={{
        back: t("backToPosts"),
        onThisPage: t("onThisPage"),
        bodyMissing: t("bodyMissing"),
        fallbackNotice: t("fallbackNotice"),
      }}
    />
  );
}
