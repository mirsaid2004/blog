"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useIsDark } from "./use-is-dark";

// WebGL backgrounds are client-only and loaded on demand, one per page.
const Aurora = dynamic(() => import("@/components/react-bits/Aurora"), { ssr: false });
const Threads = dynamic(() => import("@/components/react-bits/Threads"), { ssr: false });
const Galaxy = dynamic(() => import("@/components/react-bits/Galaxy"), { ssr: false });

export type BackdropVariant = "aurora" | "threads" | "galaxy";

/**
 * Animated header background for archive pages: a react-bits WebGL effect that
 * fades into the page background so content below stays readable.
 */
export default function ArchiveBackdrop({ variant }: { variant: BackdropVariant }) {
  const isDark = useIsDark();

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 -z-10 h-136 overflow-hidden transition-opacity duration-1000",
        "mask-[linear-gradient(to_bottom,black_45%,transparent)]",
        isDark === null ? "opacity-0" : isDark ? "opacity-100" : "opacity-60"
      )}
    >
      {isDark !== null && <Effect variant={variant} isDark={isDark} />}
    </div>
  );
}

function Effect({ variant, isDark }: { variant: BackdropVariant; isDark: boolean }) {
  switch (variant) {
    case "aurora":
      return (
        <Aurora
          colorStops={isDark ? ["#1d4ed8", "#0e9f9b", "#4338ca"] : ["#93c5fd", "#0072f5", "#67e8f9"]}
          amplitude={1.1}
          blend={0.6}
          height={0.4}
          brightness={isDark ? 0.9 : 1}
          speed={0.6}
          lightMode={!isDark}
          mouseInteraction={false}
        />
      );
    case "threads":
      return (
        <Threads
          className="h-full w-full"
          color={isDark ? "#6afdf9" : "#0072f5"}
          accentColor={isDark ? "#3b82f6" : "#67e8f9"}
          amplitude={1.2}
          distance={0.3}
          lineCount={60}
          speed={0.4}
          brightness={isDark ? 1.1 : 1.4}
          enableMouseInteraction
        />
      );
    case "galaxy":
      return (
        // Galaxy's own `lightMode` renders stars as dark ink. On light backgrounds we use the
        // local `glowOnLight` mode with saturated primary blues instead.
        <Galaxy
          className="h-full w-full"
          transparent
          glowOnLight={!isDark}
          starColors={isDark ? undefined : ["#0072f5", "#2563eb", "#4f46e5", "#0ea5e9"]}
          hueShift={180}
          saturation={0.4}
          density={isDark ? 0.9 : 0.75}
          glowIntensity={0.35}
          starSpeed={0.3}
          rotationSpeed={0.05}
          mouseRepulsion={false}
          clickWarp={false}
        />
      );
  }
}
