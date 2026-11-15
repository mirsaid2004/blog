import { getViewer } from "@/lib/auth";
import { presignGet, privateBucket } from "@/lib/r2";

/**
 * Note images from the private bucket, for the admin only: checks the session,
 * then redirects to a URL that is valid for five minutes.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return new Response("Not found", { status: 404 });

  const key = (await params).key.join("/");
  if (!/^notes\/[A-Za-z0-9_-]+\/[0-9a-f]{16}\.(webp|jpg|gif)$/.test(key)) return new Response("Not found", { status: 404 });

  return new Response(null, {
    status: 302,
    headers: { location: await presignGet(privateBucket(), key), "cache-control": "private, max-age=240" },
  });
}
