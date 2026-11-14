"use client";

import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

/** Browser-side auth: sign-in redirects, sign-out and the session hook. Same origin as the app. */
export const authClient = createAuthClient({
  plugins: [customSessionClient<ReturnType<typeof auth>>()],
});

export const { useSession, signIn, signOut } = authClient;
