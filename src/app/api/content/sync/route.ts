import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/source";
import { syncContent } from "@/lib/content/sync";
import { isCronAuthorized } from "@/lib/cron";

/**
 * Re-sync the content index from the content repo, e.g. after a missed webhook.
 * Requires `Authorization: Bearer <CRON_SECRET>`. The daily cron
 * (/api/cron/daily) also syncs; call this by hand when needed:
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/content/sync
 */

async function handle(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const result = await syncContent();
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json(result);
}

export const GET = handle;
export const POST = handle;
