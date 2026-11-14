import { verify } from "@octokit/webhooks-methods";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/source";
import { BRANCH, syncContent } from "@/lib/content/sync";

/**
 * GitHub App webhook for the content repo. A push to `main` re-syncs the content
 * index and revalidates every content page; anything else is acknowledged and
 * ignored. GitHub signs each delivery with GITHUB_WEBHOOK_SECRET
 * (X-Hub-Signature-256), so unsigned or forged requests are rejected.
 */

export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "GITHUB_WEBHOOK_SECRET is not set" }, { status: 500 });

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  if (!signature || !(await verify(secret, body, signature).catch(() => false))) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event === "ping") return Response.json({ ok: true, event });
  if (event !== "push") return Response.json({ ignored: event }, { status: 202 });

  const payload = JSON.parse(body) as { ref?: string; repository?: { full_name?: string } };
  if (payload.repository?.full_name?.toLowerCase() !== process.env.GITHUB_CONTENT_REPO?.toLowerCase()) {
    return Response.json({ ignored: "repository" }, { status: 202 });
  }
  if (payload.ref !== `refs/heads/${BRANCH}`) return Response.json({ ignored: payload.ref }, { status: 202 });

  const result = await syncContent();
  // Expire immediately: the next visit renders the new content instead of a stale copy.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  if (result.errors.length) console.error("content sync: invalid files", result.errors);
  return Response.json(result);
}
