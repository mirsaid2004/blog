"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";

/**
 * Resolved theme for effects that need concrete colors (WebGL, inline styles).
 * `null` until mounted, since the theme is unknown during SSR and hydration.
 */
export function useIsDark(): boolean | null {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted || !resolvedTheme) return null;
  return resolvedTheme === "dark";
}

/** Concrete values of the theme tokens in globals.css, for APIs that can't read CSS variables. */
export const THEME_COLORS = {
  light: { primary: "#0072f5", card: "#ffffff" },
  // --primary: 179 97% 71%, --card: 213 25% 16%
  dark: { primary: "#6afdf9", card: "#1f2833" },
} as const;
