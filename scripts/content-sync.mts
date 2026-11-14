/**
 * npm run content:sync — rebuild the content index in Neon from the content
 * repo's main branch. Prints rejected files. A running production app caches
 * content until its next webhook or `/api/content/sync` call; the dev server
 * reads the index on every request.
 */
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const { syncContent } = await import("../src/lib/content/sync");
const { formatIssues } = await import("../src/lib/content/parse");

const result = await syncContent();
console.log(
  `Synced ${result.commit.slice(0, 7)}: ${result.items} items, ${result.downloaded} files downloaded, ${result.removed} removed`
);
if (result.warnings.length) console.warn(`\nWarnings:\n${formatIssues(result.warnings)}`);
if (result.errors.length) {
  console.error(`\nRejected (previous version kept):\n${formatIssues(result.errors)}`);
  process.exitCode = 1;
}
