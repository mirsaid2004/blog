import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import ContentDetail from "@/components/article/ContentDetail";
import { firstParam, getPostBySlug, getPosts, getSeriesContext } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Every slug in every locale. Also makes `next build` read and validate content/,
 * so a malformed file fails the build instead of a request.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getPosts(locale).map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function PostPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();

  const t = await getTranslations("Post");
  const seriesContext = getSeriesContext(post.id, firstParam((await searchParams).series), locale);

  return (
    <ContentDetail
      item={post}
      seriesContext={seriesContext}
      labels={{
        back: t("backToPosts"),
        onThisPage: t("onThisPage"),
        bodyMissing: t("bodyMissing"),
      }}
    />
  );
}
