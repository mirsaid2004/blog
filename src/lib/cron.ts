import { timingSafeEqual } from "node:crypto";

/** Whether a request carries `Authorization: Bearer <CRON_SECRET>` (sent by the Netlify scheduled function). */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
