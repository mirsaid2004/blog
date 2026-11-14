"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/content/source";
import { syncContent } from "@/lib/content/sync";

export type SyncState =
  | { status: "idle" }
  | { status: "ok"; items: number; downloaded: number; removed: number }
  | { status: "error"; message: string };

/** Re-sync the content index from the content repo. Admin only. */
export async function syncNow(): Promise<SyncState> {
  await requireAdmin();
  try {
    const result = await syncContent();
    updateTag(CONTENT_TAG);
    return { status: "ok", items: result.items, downloaded: result.downloaded, removed: result.removed };
  } catch (error) {
    return { status: "error", message: (error as Error).message };
  }
}
