"use client";

import { useEffect, useState } from "react";

/** Space covered by the fixed navbar; content under it doesn't count as on screen. */
const TOP_OFFSET = 96;

/**
 * Ids of the headings whose sections are currently on screen. A section runs from
 * its heading to the next heading (the last one to the end of its <article>), so
 * the TOC highlights exactly the range of content the reader is looking at.
 * Before the first heading, nothing is active.
 */
export function useActiveHeadings(ids: string[]): Set<string> {
  const [active, setActive] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;
    const article = headings[0].closest("article");

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewTop = TOP_OFFSET;
      const viewBottom = window.innerHeight;
      const tops = headings.map((el) => el.getBoundingClientRect().top);
      const end = article?.getBoundingClientRect().bottom ?? Infinity;

      const next = new Set<string>();
      headings.forEach((el, i) => {
        const start = tops[i];
        const stop = i + 1 < tops.length ? tops[i + 1] : end;
        if (start < viewBottom && stop > viewTop) next.add(el.id);
      });

      setActive((prev) =>
        prev.size === next.size && [...next].every((id) => prev.has(id)) ? prev : next
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  return active;
}
