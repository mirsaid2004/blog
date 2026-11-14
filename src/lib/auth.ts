import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { db, schema } from "@/lib/db";

/**
 * Sign-in with GitHub and Google (PLAN.md 2.5). Users, sessions and linked
 * accounts live in Neon. Readers are anyone signed in; the admin is whoever has
 * a linked GitHub account whose numeric id is in ADMIN_GITHUB_IDS. That's
 * checked on every request rather than stored, so editing the env var takes
 * effect immediately, and it never depends on an email address.
 */

const adminGithubIds = () =>
  (process.env.ADMIN_GITHUB_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

/** Whether the user has a linked GitHub account on the admin allowlist. */
export async function isAdminUser(userId: string): Promise<boolean> {
  const ids = adminGithubIds();
  if (ids.length === 0) return false;
  const [row] = await db()
    .select({ id: schema.account.id })
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "github"),
        inArray(schema.account.accountId, ids)
      )
    )
    .limit(1);
  return Boolean(row);
}

function socialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    providers.github = { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET };
  }
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    providers.google = { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET };
  }
  return providers;
}

function createAuth() {
  const { user, session, account, verification } = schema;
  return betterAuth({
    appName: "M_DEV",
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db(), { provider: "pg", schema: { user, session, account, verification } }),
    socialProviders: socialProviders(),
    account: {
      // The same person signing in with GitHub and Google (same verified email) gets one user.
      accountLinking: { enabled: true, trustedProviders: ["github", "google"] },
    },
    session: {
      // Sign the session into a short-lived cookie so most requests skip the database.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [
      customSession(async ({ user, session }) => ({
        user: { ...user, isAdmin: await isAdminUser(user.id) },
        session,
      })),
      // Must stay last: lets server actions set auth cookies.
      nextCookies(),
    ],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export function auth() {
  return (instance ??= createAuth());
}

export type Viewer = { id: string; name: string; email: string; image: string | null; isAdmin: boolean };

/** The signed-in user for this request, or null. Deduped within a request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const result = await auth().api.getSession({ headers: await headers() });
  if (!result) return null;
  const { id, name, email, image } = result.user;
  // Re-check on the server rather than trusting the cached session field.
  return { id, name, email, image: image ?? null, isAdmin: await isAdminUser(id) };
});

/**
 * For admin-only server actions and route handlers. Throws for anyone else;
 * pages use getViewer() and render notFound() instead.
 */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) throw new Error("Forbidden");
  return viewer;
}
