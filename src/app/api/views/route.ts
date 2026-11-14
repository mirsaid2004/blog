import { routing } from "@/i18n/routing";
import { isBot, recordView, visitorHash } from "@/lib/engagement/views";

/**
 * POST { id, locale } from the view beacon on detail pages. Always answers 204
 * so the beacon never retries or reveals whether a view counted.
 */
export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return new Response(null, { status: 204 });

  let body: { id?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { id, locale } = body;
  if (typeof id !== "string" || id.length > 200 || !routing.locales.includes(locale as never)) {
    return new Response(null, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  try {
    await recordView(id, locale as string, visitorHash(ip, userAgent, day), day);
  } catch (error) {
    console.error("view not recorded", error);
  }
  return new Response(null, { status: 204 });
}
