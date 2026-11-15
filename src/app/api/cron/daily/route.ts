import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/source";
import { syncContent } from "@/lib/content/sync";
import { isCronAuthorized } from "@/lib/cron";
import { sweepOrphanAssets } from "@/lib/editor/assets";
import { pruneViewEvents } from "@/lib/engagement/views";

/**
 * Daily maintenance, called by the Netlify scheduled function
 * (netlify/functions/daily-maintenance.mts) with `Authorization: Bearer <CRON_SECRET>`:
 * - re-sync content, in case a webhook delivery was missed;
 * - delete view events older than the retention window (totals are kept);
 * - delete orphaned draft images (PLAN.md 2.3). Usually there are none, so this
 *   runs daily rather than on a separate weekly schedule.
 */

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [sync, pruned, swept] = await Promise.allSettled([syncContent(), pruneViewEvents(), sweepOrphanAssets()]);
  if (sync.status === "fulfilled") revalidateTag(CONTENT_TAG, { expire: 0 });

  const report = (result: PromiseSettledResult<unknown>) =>
    result.status === "fulfilled" ? result.value : { error: String(result.reason) };
  const ok = [sync, pruned, swept].every((r) => r.status === "fulfilled");
  return Response.json(
    { sync: report(sync), prunedViewEvents: report(pruned), orphanImages: report(swept) },
    { status: ok ? 200 : 500 }
  );
}
