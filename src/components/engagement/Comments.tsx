import { getFormatter, getTranslations } from "next-intl/server";
import { MessageSquare } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { listComments } from "@/lib/engagement/comments";
import { cn } from "@/lib/utils";
import { CommentActions, CommentForm } from "./CommentControls";

function Avatar({ name, image }: { name: string; image: string | null }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/**
 * Comments under a piece. Rendered on the server for every request (the list
 * isn't cached), so a new comment shows up on the router refresh after posting.
 * Hidden comments are shown, dimmed, to the admin only.
 */
export async function Comments({ contentId, locale }: { contentId: string; locale: string }) {
  const [viewer, t, format] = await Promise.all([getViewer(), getTranslations("Comments"), getFormatter()]);
  const comments = await listComments(contentId, viewer?.isAdmin ?? false);

  return (
    <section aria-labelledby="comments-title" className="mt-12 border-t border-border pt-10">
      <h2 id="comments-title" className="mb-6 flex items-center gap-2 text-xl font-bold">
        <MessageSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
        {t("title", { count: comments.filter((c) => !c.hidden).length })}
      </h2>

      {comments.length > 0 && (
        <ol className="mb-8 space-y-5">
          {comments.map((comment) => (
            <li key={comment.id} id={`comment-${comment.id}`} className={cn("flex gap-3", comment.hidden && "opacity-50")}>
              <Avatar name={comment.author.name} image={comment.author.image} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-semibold text-foreground">{comment.author.name}</span>
                  <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(comment.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                  {comment.hidden && <span className="text-xs font-medium text-destructive">{t("hiddenLabel")}</span>}
                </p>
                {/* Plain text: line breaks kept, nothing interpreted as markup. */}
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/85">{comment.body}</p>
                <CommentActions
                  id={comment.id}
                  canDelete={viewer?.id === comment.author.id || Boolean(viewer?.isAdmin)}
                  canHide={Boolean(viewer?.isAdmin)}
                  hidden={comment.hidden}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
      {comments.length === 0 && <p className="mb-6 text-sm text-muted-foreground">{t("empty")}</p>}

      <CommentForm key={viewer?.id ?? "anonymous"} contentId={contentId} locale={locale} signedIn={Boolean(viewer)} />
    </section>
  );
}
