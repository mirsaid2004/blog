import { Link } from "@/i18n/routing";
import type { ContentItem } from "@/lib/content/types";
import ContentMeta from "./ContentMeta";
import Cover from "./Cover";
import TagList from "./TagList";

export default function ArticleCard({ article }: { article: ContentItem }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_32px_-12px_rgb(15_23_42/0.18)] dark:shadow-none">
      <Cover
        src={article.cover}
        sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
        className="aspect-16/9"
      />
      <div className="flex flex-1 flex-col p-5">
        <TagList tags={article.tags} />
        <h3 className="mt-2 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {article.summary}
        </p>
        <ContentMeta
          className="mt-auto border-t border-border pt-4"
          publishedAt={article.publishedAt}
          readMinutes={article.readMinutes}
          views={article.views}
          rating={article.rating}
          ratingCount={article.ratingCount}
        />
      </div>
    </article>
  );
}
