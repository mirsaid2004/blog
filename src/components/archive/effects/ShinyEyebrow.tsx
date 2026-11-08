"use client";

import ShinyText from "@/components/react-bits/ShinyText";
import { THEME_COLORS, useIsDark } from "./use-is-dark";

/** Section label with react-bits ShinyText: a light band sweeps across the text. */
export default function ShinyEyebrow({ text }: { text: string }) {
  const isDark = useIsDark() ?? true;
  return (
    <ShinyText
      text={text}
      color={isDark ? THEME_COLORS.dark.primary : THEME_COLORS.light.primary}
      shineColor={isDark ? "#ffffff" : "#bae6fd"}
      speed={3}
      className="text-xs font-bold uppercase tracking-[0.2em]"
    />
  );
}
