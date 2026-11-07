import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { ContentItem } from "@/lib/content/types";
import ContentMeta from "./ContentMeta";
import Cover from "./Cover";
import TagList from "./TagList";

export default function FeaturedArticle({ article }: { article: ContentItem }) {
  const t = useTranslations("Archive.articles");
  return (
    <article className="group relative mb-8 grid overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.16)] transition-colors hover:border-primary/30 md:grid-cols-[1.15fr_1fr] dark:shadow-none">
      <Cover
        src={article.cover}
        sizes="(min-width: 1024px) 640px, 100vw"
        priority
        className="aspect-16/9 md:aspect-auto md:min-h-80"
      />
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
            {t("featured")}
          </span>
          <TagList tags={article.tags} />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
          <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{article.summary}</p>
        <ContentMeta
          className="mt-6"
          publishedAt={article.publishedAt}
          readMinutes={article.readMinutes}
          views={article.views}
          rating={article.rating}
          ratingCount={article.ratingCount}
        />
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {t("readCta")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}
