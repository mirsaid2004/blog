import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Reader comments (PLAN.md phase 6). Plain text only, rendered as text, so no
 * markup or HTML from readers ever reaches the page. Comments show right away;
 * the admin can hide (kept, admin-only) or delete them.
 */

export const MAX_COMMENT_LENGTH = 2000;
/** At most this many comments per reader in RATE_WINDOW_MINUTES. */
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MINUTES = 10;

export interface CommentView {
  id: string;
  body: string;
  createdAt: string;
  hidden: boolean;
  author: { id: string; name: string; image: string | null };
}

/** Comments on a piece, oldest first. Hidden ones only when `includeHidden` (admin). */
export async function listComments(contentId: string, includeHidden: boolean): Promise<CommentView[]> {
  const { comment, user } = schema;
  const rows = await db()
    .select({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      hiddenAt: comment.hiddenAt,
      authorId: user.id,
      name: user.name,
      image: user.image,
    })
    .from(comment)
    .innerJoin(user, eq(user.id, comment.userId))
    .where(includeHidden ? eq(comment.contentId, contentId) : and(eq(comment.contentId, contentId), isNull(comment.hiddenAt)))
    .orderBy(comment.createdAt)
    .limit(500);
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    hidden: r.hiddenAt !== null,
    author: { id: r.authorId, name: r.name, image: r.image },
  }));
}

/** Whether the reader has hit the comment rate limit. */
export async function isRateLimited(userId: string): Promise<boolean> {
  const [{ recent }] = await db()
    .select({ recent: count() })
    .from(schema.comment)
    .where(
      and(
        eq(schema.comment.userId, userId),
        gt(schema.comment.createdAt, sql`now() - make_interval(mins => ${RATE_WINDOW_MINUTES})`)
      )
    );
  return recent >= RATE_LIMIT;
}

export async function insertComment(input: { id: string; contentId: string; userId: string; body: string; locale: string }) {
  await db().insert(schema.comment).values(input);
}

export async function commentOwner(id: string): Promise<string | null> {
  const [row] = await db().select({ userId: schema.comment.userId }).from(schema.comment).where(eq(schema.comment.id, id)).limit(1);
  return row?.userId ?? null;
}

export async function deleteComment(id: string) {
  await db().delete(schema.comment).where(eq(schema.comment.id, id));
}

export async function setCommentHidden(id: string, hidden: boolean) {
  await db()
    .update(schema.comment)
    .set({ hiddenAt: hidden ? sql`now()` : null })
    .where(eq(schema.comment.id, id));
}

export interface AdminComment extends CommentView {
  contentId: string;
  locale: string;
}

/** Newest comments across the site, for the admin dashboard. */
export async function recentComments(limit = 30): Promise<AdminComment[]> {
  const { comment, user } = schema;
  const rows = await db()
    .select({
      id: comment.id,
      contentId: comment.contentId,
      locale: comment.locale,
      body: comment.body,
      createdAt: comment.createdAt,
      hiddenAt: comment.hiddenAt,
      authorId: user.id,
      name: user.name,
      image: user.image,
    })
    .from(comment)
    .innerJoin(user, eq(user.id, comment.userId))
    .orderBy(desc(comment.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    contentId: r.contentId,
    locale: r.locale,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    hidden: r.hiddenAt !== null,
    author: { id: r.authorId, name: r.name, image: r.image },
  }));
}
