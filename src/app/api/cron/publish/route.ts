import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/source";
import { isCronAuthorized } from "@/lib/cron";
import { publishDue } from "@/lib/editor/publish";

/**
 * Scheduled publishing, called every hour by the Netlify scheduled function
 * (netlify/functions/scheduled-publish.mts) with `Authorization: Bearer <CRON_SECRET>`.
 * Publishes the drafts whose time has come (see src/lib/editor/publish.ts).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const results = await publishDue();
  if (results.some((r) => r.ok)) revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ published: results }, { status: results.every((r) => r.ok) ? 200 : 500 });
}
