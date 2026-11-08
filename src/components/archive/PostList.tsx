import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ContentItem } from "@/lib/content/types";
import { formatDate, formatMonth } from "@/lib/content/format";
import ContentMeta from "./ContentMeta";
import TagList from "./TagList";
import { SpotlightSurface } from "./effects/Surfaces";

interface PostListProps {
  posts: ContentItem[];
  /** Group under month headings. Only meaningful when sorted by date. */
  groupByMonth: boolean;
}

export default function PostList({ posts, groupByMonth }: PostListProps) {
  const locale = useLocale();

  if (!groupByMonth) {
    return (
      <SpotlightSurface size={460}>
        <ol className="divide-y divide-border">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </ol>
      </SpotlightSurface>
    );
  }

  const groups = new Map<string, ContentItem[]>();
  for (const post of posts) {
    const key = post.publishedAt.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), post]);
  }

  return (
    <SpotlightSurface size={460} className="divide-y divide-border">
      {[...groups.entries()].map(([month, items]) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <h2
            id={`month-${month}`}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary md:px-6"
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            {formatMonth(`${month}-01`, locale)}
          </h2>
          <ol className="divide-y divide-border border-t border-border">
            {items.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </ol>
        </section>
      ))}
    </SpotlightSurface>
  );
}

function PostRow({ post }: { post: ContentItem }) {
  const locale = useLocale();
  return (
    <li className="group relative grid gap-1 p-5 transition-colors hover:bg-primary/4 md:grid-cols-[7.5rem_1fr] md:gap-6 md:p-6">
      <time
        dateTime={post.publishedAt}
        className="text-sm font-medium tabular-nums text-muted-foreground md:pt-0.5"
      >
        {formatDate(post.publishedAt, locale)}
      </time>
      <div className="min-w-0">
        <h3 className="text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          <Link href={`/posts/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <TagList tags={post.tags} />
          <ContentMeta
            readMinutes={post.readMinutes}
            views={post.views}
            rating={post.rating}
            ratingCount={post.ratingCount}
          />
        </div>
      </div>
    </li>
  );
}
