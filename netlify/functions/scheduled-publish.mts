/**
 * Netlify Scheduled Function: every hour, call the app's /api/cron/publish
 * route, which publishes drafts whose scheduled time has come. Like the daily
 * job, it needs CRON_SECRET in the site's environment variables and runs only
 * on production deploys ("Run now" in the Netlify UI runs it by hand).
 */

const runScheduledPublish = async () => {
  const site = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!site || !secret) {
    console.error("scheduled-publish: URL/NEXT_PUBLIC_SITE_URL or CRON_SECRET is not set");
    return new Response("not configured", { status: 500 });
  }

  const response = await fetch(new URL("/api/cron/publish", site), {
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await response.text();
  if (!response.ok) console.error(`scheduled-publish: ${response.status} ${body}`);
  else console.log(`scheduled-publish: ${body}`);
  return new Response(null, { status: response.ok ? 204 : 502 });
};

export const config = { schedule: "@hourly" };

export default runScheduledPublish;
