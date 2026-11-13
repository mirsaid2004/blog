"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TextAlignStart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/content/mdx";
import { useActiveHeadings } from "./use-active-headings";

interface TableOfContentsProps {
  items: TocItem[];
  title: string;
  className?: string;
}

/** x position of the track line for a heading depth. */
const lineX = (depth: number) => (depth <= 2 ? 1 : depth === 3 ? 13 : 25);
/** Text sits this far right of its line. */
const TEXT_GAP = 14;
/** Half the height of the angled connector drawn where the depth changes. */
const BEND = 6;
/** Height of the fade at an edge of the rail that has hidden items. */
const FADE = 32;

interface Geometry {
  path: string;
  width: number;
  height: number;
  /** Top/bottom of each item, relative to the track. */
  spans: { top: number; bottom: number }[];
}

/**
 * "On this page" rail in the style of Better Auth / Fumadocs (clerk layout).
 *
 * The track is one SVG path through every item that bends where nesting changes.
 * The thumb is a filled bar masked by that same path, so as it moves to cover the
 * sections currently on screen it follows the bends instead of cutting across them.
 */
export default function TableOfContents({ items, title, className }: TableOfContentsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [overflow, setOverflow] = useState({ top: false, bottom: false });

  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const active = useActiveHeadings(ids);

  const measure = useCallback(() => {
    const spans = linkRefs.current.map((el) =>
      el ? { top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight } : { top: 0, bottom: 0 }
    );
    let path = "";
    items.forEach((item, i) => {
      const x = lineX(item.depth);
      const bendIn = i > 0 && lineX(items[i - 1].depth) !== x;
      const bendOut = i < items.length - 1 && lineX(items[i + 1].depth) !== x;
      const start = spans[i].top + (bendIn ? BEND : 0);
      const end = spans[i].bottom - (bendOut ? BEND : 0);
      // Consecutive segments join with a straight line, which draws the bend.
      path += `${i === 0 ? "M" : "L"}${x} ${start} L${x} ${end} `;
    });
    const width = Math.max(...items.map((item) => lineX(item.depth))) + 2;
    const height = trackRef.current?.offsetHeight ?? 0;
    setGeometry({ path: path.trim(), width, height, spans });
  }, [items]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Measures once immediately, then whenever wrapping changes item heights.
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  // Fade whichever edge of the rail has hidden items, so it's clear the list scrolls.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const update = () => {
      const top = scroller.scrollTop > 1;
      const bottom = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1;
      setOverflow((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  // Keep the active range in view when the rail itself overflows (long TOCs),
  // treating the faded edges as hidden.
  const firstActive = items.findIndex((item) => active.has(item.id));
  useEffect(() => {
    const scroller = scrollRef.current;
    const link = linkRefs.current[firstActive];
    if (!scroller || !link || scroller.scrollHeight <= scroller.clientHeight) return;
    const top = link.offsetTop;
    const visibleTop = scroller.scrollTop + FADE;
    const visibleBottom = scroller.scrollTop + scroller.clientHeight - FADE;
    if (top < visibleTop || top + link.offsetHeight > visibleBottom) {
      scroller.scrollTo({ top: top - scroller.clientHeight / 3, behavior: "smooth" });
    }
  }, [firstActive]);

  if (items.length === 0) return null;

  let lastActive = -1;
  items.forEach((item, i) => {
    if (active.has(item.id)) lastActive = i;
  });
  const thumb =
    geometry && firstActive !== -1
      ? { top: geometry.spans[firstActive].top, height: geometry.spans[lastActive].bottom - geometry.spans[firstActive].top }
      : null;

  const edgeFade =
    overflow.top || overflow.bottom
      ? `linear-gradient(to bottom, ${overflow.top ? "transparent" : "black"}, black ${FADE}px, black calc(100% - ${FADE}px), ${overflow.bottom ? "transparent" : "black"})`
      : undefined;

  const mask = geometry
    ? `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.width}" height="${geometry.height}"><path d="${geometry.path}" stroke="black" stroke-width="2" fill="none"/></svg>`
      )}")`
    : undefined;

  return (
    <nav aria-label={title} className={cn("flex min-h-0 flex-col text-sm", className)}>
      <p className="flex items-center gap-2 text-muted-foreground">
        <TextAlignStart className="h-4 w-4" aria-hidden />
        {title}
      </p>

      <div
        ref={scrollRef}
        className="relative mt-3 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: edgeFade, WebkitMaskImage: edgeFade }}
      >
        <div ref={trackRef} className="relative">
          {geometry && (
            <>
              <svg
                aria-hidden
                width={geometry.width}
                height={geometry.height}
                className="pointer-events-none absolute left-0 top-0 text-foreground/10"
              >
                <path d={geometry.path} stroke="currentColor" strokeWidth={1} fill="none" />
              </svg>
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 top-0"
                style={{
                  width: geometry.width,
                  height: geometry.height,
                  maskImage: mask,
                  WebkitMaskImage: mask,
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                }}
              >
                <div
                  className="absolute inset-x-0 bg-foreground transition-[top,height,opacity] duration-300 ease-out"
                  style={{ top: thumb?.top ?? 0, height: thumb?.height ?? 0, opacity: thumb ? 1 : 0 }}
                />
              </div>
            </>
          )}

          <ul>
            {items.map((item, i) => {
              const isActive = active.has(item.id);
              return (
                <li key={item.id}>
                  <a
                    ref={(el) => {
                      linkRefs.current[i] = el;
                    }}
                    href={`#${item.id}`}
                    aria-current={isActive ? "location" : undefined}
                    onClick={(e) => {
                      const target = document.getElementById(item.id);
                      if (!target) return;
                      e.preventDefault();
                      target.scrollIntoView({ behavior: "smooth", block: "start" });
                      history.replaceState(null, "", `#${item.id}`);
                    }}
                    style={{ paddingLeft: lineX(item.depth) + TEXT_GAP }}
                    className={cn(
                      "block py-1.5 leading-snug transition-colors [overflow-wrap:anywhere]",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
