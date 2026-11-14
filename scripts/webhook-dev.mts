/**
 * npm run webhook:dev — forward GitHub webhook deliveries from the smee.io
 * channel in SMEE_URL to the local dev server. The GitHub App's webhook URL must
 * be that channel (see doc/setup-services.md). Production doesn't use this.
 */
import nextEnv from "@next/env";
import SmeeClient from "smee-client";

nextEnv.loadEnvConfig(process.cwd());

const source = process.env.SMEE_URL;
if (!source) {
  console.error("Set SMEE_URL in .env to your smee.io channel (see doc/setup-services.md)");
  process.exit(1);
}
const target = `http://localhost:${process.env.PORT ?? 3000}/api/webhooks/github`;

const client = new SmeeClient({ source, target, logger: console });
await client.start();
console.log(`Forwarding ${source} → ${target}`);
