"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORT_KEYS, type SortKey } from "@/lib/content/types";

interface ArchiveToolbarProps {
  tags: { tag: string; count: number }[];
  resultCount: number;
}

const SEARCH_DEBOUNCE_MS = 250;

export default function ArchiveToolbar({ tags, resultCount }: ArchiveToolbarProps) {
  const t = useTranslations("Archive.common");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTag = searchParams.get("tag");
  const sortParam = searchParams.get("sort") as SortKey | null;
  const activeSort: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : "latest";
  const urlQuery = searchParams.get("q") ?? "";

  // Keep the input in sync when the URL changes from elsewhere (e.g. "Clear filters"),
  // without clobbering what the user is typing while their own update is in flight.
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const [pushedQuery, setPushedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    if (urlQuery !== pushedQuery) setQuery(urlQuery);
  }

  const hrefWith = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Debounced push of the search query into the URL.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQuery) return;
    const timer = setTimeout(() => {
      setPushedQuery(trimmed);
      startTransition(() => {
        router.replace(hrefWith({ q: trimmed || null }), { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // hrefWith is derived from searchParams/pathname, which are already covered by urlQuery changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // "/" focuses the search box, like most docs and blog sites.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const hasFilters = Boolean(urlQuery || activeTag || activeSort !== "latest");

  return (
    <div className="mb-10 flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{t("searchLabel")}</span>
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                setQuery("");
              }
            }}
            placeholder={t("searchPlaceholder")}
            className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-12 text-sm text-foreground shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25 [&::-webkit-search-cancel-button]:hidden"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {isPending ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t("clearFilters")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground sm:flex">
                /
              </kbd>
            )}
          </span>
        </label>

        <nav
          aria-label={t("sortLabel")}
          className="flex h-12 shrink-0 items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm"
        >
          {SORT_KEYS.map((key) => {
            const active = key === activeSort;
            return (
              <NextLink
                key={key}
                href={hrefWith({ sort: key === "latest" ? null : key })}
                scroll={false}
                replace
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors md:flex-none",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t(`sort.${key}`)}
              </NextLink>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label={t("topicsLabel")} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max items-center gap-2 pb-1 md:w-auto md:flex-wrap md:pb-0">
            <li>
              <TagChip href={hrefWith({ tag: null })} active={!activeTag}>
                {t("allTopics")}
              </TagChip>
            </li>
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <TagChip href={hrefWith({ tag: activeTag === tag ? null : tag })} active={activeTag === tag}>
                  #{tag}
                  <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
                </TagChip>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
          <span>{t("results", { count: resultCount })}</span>
          {hasFilters && (
            <NextLink
              href={pathname}
              scroll={false}
              replace
              onClick={() => setQuery("")}
              className="font-medium text-primary hover:underline"
            >
              {t("clearFilters")}
            </NextLink>
          )}
        </div>
      </div>
    </div>
  );
}

function TagChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <NextLink
      href={href}
      scroll={false}
      replace
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
      )}
    >
      {children}
    </NextLink>
  );
}
