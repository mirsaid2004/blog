import type { ReactNode } from "react";

const STEP_MS = 70;
const MAX_DELAY_MS = 560;

/** Staggered fade-up on first paint (tw-animate-css; disabled under prefers-reduced-motion). */
export default function Reveal({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div
      className="h-full animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 ease-out motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index * STEP_MS, MAX_DELAY_MS)}ms` }}
    >
      {children}
    </div>
  );
}
