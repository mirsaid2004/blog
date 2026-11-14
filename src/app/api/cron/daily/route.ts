import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/source";
import { syncContent } from "@/lib/content/sync";
import { isCronAuthorized } from "@/lib/cron";
import { pruneViewEvents } from "@/lib/engagement/views";

/**
 * Daily maintenance, called by the Netlify scheduled function
 * (netlify/functions/daily-maintenance.mts) with `Authorization: Bearer <CRON_SECRET>`:
 * - re-sync content, in case a webhook delivery was missed;
 * - delete view events older than the retention window (totals are kept).
 */

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [sync, pruned] = await Promise.allSettled([syncContent(), pruneViewEvents()]);
  if (sync.status === "fulfilled") revalidateTag(CONTENT_TAG, { expire: 0 });

  const report = (result: PromiseSettledResult<unknown>) =>
    result.status === "fulfilled" ? result.value : { error: String(result.reason) };
  const ok = sync.status === "fulfilled" && pruned.status === "fulfilled";
  return Response.json({ sync: report(sync), prunedViewEvents: report(pruned) }, { status: ok ? 200 : 500 });
}
