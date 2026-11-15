/**
 * Netlify Scheduled Function: once a day (04:00 UTC), call the app's
 * /api/cron/daily route, which re-syncs content in case a webhook was missed,
 * prunes old view events and deletes orphaned draft images. The route checks CRON_SECRET, so the secret must
 * be set in the Netlify site's environment variables.
 *
 * Scheduled functions run only on published (production) deploys. To run it by
 * hand, use "Run now" on the function in the Netlify UI.
 */

const runDailyMaintenance = async () => {
  const site = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!site || !secret) {
    console.error("daily-maintenance: URL/NEXT_PUBLIC_SITE_URL or CRON_SECRET is not set");
    return new Response("not configured", { status: 500 });
  }

  const response = await fetch(new URL("/api/cron/daily", site), {
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await response.text();
  if (!response.ok) console.error(`daily-maintenance: ${response.status} ${body}`);
  else console.log(`daily-maintenance: ${body}`);
  return new Response(null, { status: response.ok ? 204 : 502 });
};

export const config = { schedule: "0 4 * * *" };

export default runDailyMaintenance;