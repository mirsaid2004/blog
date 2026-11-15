"use server";

import { updateTag } from "next/cache";
import { routing } from "@/i18n/routing";
import { getViewer } from "@/lib/auth";
import { STATS_TAG } from "@/lib/content/stats";
import { newId } from "@/lib/editor/format";
import {
  commentOwner,
  deleteComment,
  insertComment,
  isRateLimited,
  MAX_COMMENT_LENGTH,
  setCommentHidden,
} from "./comments";
import { contentExists, setUserRating } from "./ratings";

export type RateResult = { ok: true; value: number | null } | { ok: false; error: "signedOut" | "invalid" };

/** Rate a piece 1–5, or pass null to remove your rating. Signed-in readers only. */
export async function rateContent(contentId: string, value: number | null): Promise<RateResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "signedOut" };
  if (typeof contentId !== "string" || (value !== null && !(Number.isInteger(value) && value >= 1 && value <= 5))) {
    return { ok: false, error: "invalid" };
  }
  if (!(await contentExists(contentId))) return { ok: false, error: "invalid" };

  await setUserRating(viewer.id, contentId, value);
  // Lists and this page show the new average on the next render.
  updateTag(STATS_TAG);
  return { ok: true, value };
}

export type CommentResult = { ok: true } | { ok: false; error: "signedOut" | "invalid" | "tooLong" | "tooFast" | "forbidden" };

/** Post a plain-text comment on a piece. Signed-in readers only, rate limited. */
export async function postComment(contentId: string, locale: string, body: string): Promise<CommentResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "signedOut" };
  if (typeof contentId !== "string" || typeof body !== "string" || !routing.locales.includes(locale as never)) {
    return { ok: false, error: "invalid" };
  }
  // Normalise line endings and cap blank lines, so a comment can't be mostly whitespace.
  const text = body.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return { ok: false, error: "invalid" };
  if (text.length > MAX_COMMENT_LENGTH) return { ok: false, error: "tooLong" };
  if (!(await contentExists(contentId))) return { ok: false, error: "invalid" };
  if (await isRateLimited(viewer.id)) return { ok: false, error: "tooFast" };

  await insertComment({ id: newId(), contentId, userId: viewer.id, body: text, locale });
  return { ok: true };
}

/** Delete a comment: its author or the admin. */
export async function removeComment(id: string): Promise<CommentResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "signedOut" };
  if (typeof id !== "string") return { ok: false, error: "invalid" };
  const owner = await commentOwner(id);
  if (!owner) return { ok: true };
  if (owner !== viewer.id && !viewer.isAdmin) return { ok: false, error: "forbidden" };
  await deleteComment(id);
  return { ok: true };
}

/** Hide or unhide a comment. Admin only. */
export async function hideComment(id: string, hidden: boolean): Promise<CommentResult> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { ok: false, error: "forbidden" };
  if (typeof id !== "string" || typeof hidden !== "boolean") return { ok: false, error: "invalid" };
  await setCommentHidden(id, hidden);
  return { ok: true };
}
