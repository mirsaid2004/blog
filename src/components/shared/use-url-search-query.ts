"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SEARCH_DEBOUNCE_MS = 250;

/**
 * A search box value that is mirrored into a URL query param (debounced).
 *
 * The input stays in sync when the URL changes from elsewhere (e.g. "Clear filters"),
 * without clobbering what the user is typing while their own update is in flight.
 */
export function useUrlSearchQuery(param = "q") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get(param) ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const [pushedQuery, setPushedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    if (urlQuery !== pushedQuery) setQuery(urlQuery);
  }

  // Re-running on urlQuery cancels a pending push when the URL changes elsewhere, and
  // the target URL is built from the live location when the timer fires, so other
  // params changed while it was pending (tag, sort, ...) are kept.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQuery) return;
    const timer = setTimeout(() => {
      setPushedQuery(trimmed);
      const params = new URLSearchParams(window.location.search);
      if (trimmed) params.set(param, trimmed);
      else params.delete(param);
      const qs = params.toString();
      const href = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, urlQuery, router, param]);

  /** Clear local state when the URL is being reset by a navigation elsewhere. */
  const reset = () => {
    setQuery("");
    setPushedQuery("");
  };

  return { query, setQuery, urlQuery, isPending, reset };
}
