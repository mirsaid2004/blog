"use client";

import { useMemo } from "react";
import { diffLines } from "diff";
import { cn } from "@/lib/utils";

/** Line diff, unchanged runs collapsed to a few lines of context. */
export default function DiffView({ before, after, className }: { before: string; after: string; className?: string }) {
  const parts = useMemo(() => diffLines(before, after), [before, after]);
  const CONTEXT = 3;

  if (parts.every((p) => !p.added && !p.removed)) {
    return <p className={cn("text-sm text-muted-foreground", className)}>—</p>;
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border font-mono text-xs leading-5", className)}>
      {parts.map((part, i) => {
        const lines = part.value.replace(/\n$/, "").split("\n");
        if (!part.added && !part.removed) {
          const head = i === 0 ? [] : lines.slice(0, CONTEXT);
          const tail = i === parts.length - 1 ? [] : lines.slice(-CONTEXT);
          const shown = lines.length > head.length + tail.length + 1 ? [...head, null, ...tail] : lines;
          return shown.map((line, j) =>
            line === null ? (
              <div key={`${i}-${j}`} className="bg-muted/40 px-3 text-center text-muted-foreground">
                ⋯
              </div>
            ) : (
              <div key={`${i}-${j}`} className="whitespace-pre-wrap px-3 text-muted-foreground">
                {"  "}
                {line}
              </div>
            )
          );
        }
        return lines.map((line, j) => (
          <div
            key={`${i}-${j}`}
            className={cn(
              "whitespace-pre-wrap px-3",
              part.added
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "bg-red-500/10 text-red-800 dark:text-red-300"
            )}
          >
            {part.added ? "+ " : "- "}
            {line}
          </div>
        ));
      })}
    </div>
  );
}
