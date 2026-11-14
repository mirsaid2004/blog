import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

/**
 * GitHub access for the content repo, as the "mdev-blog" GitHub App installation
 * (contents read/write on GITHUB_CONTENT_REPO only). @octokit/auth-app creates
 * the app JWT and exchanges it for hour-long installation tokens, refreshing them
 * as needed. See doc/github-content.md.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see doc/setup-services.md)`);
  return value;
}

export function contentRepo(): { owner: string; repo: string } {
  const [owner, repo] = required("GITHUB_CONTENT_REPO").split("/");
  if (!owner || !repo) throw new Error('GITHUB_CONTENT_REPO must be "owner/name"');
  return { owner, repo };
}

/**
 * The PEM key. `.env` stores it on one line with `\n` escapes, which Next turns
 * into newlines; a host's env UI (Netlify) may pass the escapes through
 * literally, so convert them here too. A key pasted with real newlines works as is.
 */
function privateKey(): string {
  return required("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
}

let client: Octokit | undefined;

/** Octokit authenticated as the app's installation on the content repo. */
export function contentOctokit(): Octokit {
  return (client ??= new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: required("GITHUB_APP_ID"),
      privateKey: privateKey(),
      installationId: required("GITHUB_APP_INSTALLATION_ID"),
    },
    userAgent: "mdev-blog",
  }));
}

/** Octokit authenticated as the app itself (app JWT), for app-level settings. */
export function appOctokit(): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId: required("GITHUB_APP_ID"), privateKey: privateKey() },
    userAgent: "mdev-blog",
  });
}
