"use server";

import { updateTag } from "next/cache";
import { getViewer } from "@/lib/auth";
import { STATS_TAG } from "@/lib/content/stats";
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
