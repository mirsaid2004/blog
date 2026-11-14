import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { contentPageMetadata } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import ContentDetail from "@/components/article/ContentDetail";
import { firstParam, getPostBySlug, getPosts, getSeriesContext } from "@/lib/content/queries";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Prerender every slug in every locale from the content index. Slugs published
 * after the build render on first request and are cached until the next sync.
 */
export async function generateStaticParams() {
  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => (await getPosts(locale)).map(({ slug }) => ({ locale, slug })))
  );
  return perLocale.flat();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale);
  if (!post) return {};
  return contentPageMetadata({ locale, path: `/posts/${slug}`, item: post, ogType: "article" });
}

export default async function PostPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale);
  if (!post) notFound();

  const t = await getTranslations("Post");
  const seriesContext = await getSeriesContext(post.id, firstParam((await searchParams).series), locale);

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
