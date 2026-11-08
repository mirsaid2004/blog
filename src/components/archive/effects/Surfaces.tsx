"use client";

import type { CSSProperties, ReactNode } from "react";
import BorderGlow from "@/components/react-bits/BorderGlow";
import GlareHover from "@/components/react-bits/GlareHover";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import { cn } from "@/lib/utils";
import { THEME_COLORS, useIsDark } from "./use-is-dark";

interface SurfaceProps {
  children: ReactNode;
  className?: string;
}

/** react-bits SpotlightCard on the site's card tokens: a soft light follows the cursor. */
export function SpotlightSurface({
  children,
  className,
  size = 280,
}: SurfaceProps & { size?: number }) {
  const isDark = useIsDark() ?? true;
  const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  return (
    <SpotlightCard
      theme={isDark ? "dark" : "light"}
      spotlightColor={colors.primary}
      spotlightSize={size}
      intensity={isDark ? 0.14 : 0.35}
      borderGlow={0.8}
      className={cn("p-0! rounded-2xl", className)}
      style={
        {
          "--spotlight-card-surface": "hsl(var(--card))",
          "--spotlight-card-border": "hsl(var(--border))",
        } as CSSProperties
      }
    >
      {children}
    </SpotlightCard>
  );
}

/** react-bits GlareHover: a light streak sweeps across the card on hover. */
export function GlareSurface({ children, className }: SurfaceProps) {
  const isDark = useIsDark() ?? true;
  return (
    <GlareHover
      width="100%"
      height="100%"
      background="hsl(var(--card))"
      borderColor="hsl(var(--border))"
      borderRadius="1.5rem"
      glareColor={isDark ? "#ffffff" : THEME_COLORS.light.primary}
      glareOpacity={isDark ? 0.18 : 0.12}
      glareSize={45}
      blendMode={isDark ? "screen" : "multiply"}
      className={cn("grid! place-items-stretch!", className)}
    >
      {children}
    </GlareHover>
  );
}

/** react-bits BorderGlow: the border lights up near the cursor. Used for the featured piece. */
export function GlowSurface({ children, className }: SurfaceProps) {
  const isDark = useIsDark() ?? true;
  return (
    <BorderGlow
      className={className}
      backgroundColor={isDark ? THEME_COLORS.dark.card : THEME_COLORS.light.card}
      borderRadius={24}
      glowColor={isDark ? "179 97 71" : "212 100 48"}
      glowRadius={32}
      glowIntensity={isDark ? 1 : 0.6}
      colors={isDark ? ["#6afdf9", "#3b82f6", "#a78bfa"] : ["#0072f5", "#38bdf8", "#818cf8"]}
      fillOpacity={isDark ? 0.4 : 0.25}
    >
      {children}
    </BorderGlow>
  );
}
