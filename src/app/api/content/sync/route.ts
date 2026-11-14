import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/source";
import { syncContent } from "@/lib/content/sync";

/**
 * Re-sync the content index from the content repo, e.g. after a missed webhook.
 * Requires `Authorization: Bearer <CRON_SECRET>`; Vercel Cron sends that header
 * on its scheduled GET (see vercel.json), and it can be called by hand:
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/content/sync
 */

export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function handle(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const result = await syncContent();
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json(result);
}

export const GET = handle;
export const POST = handle;
