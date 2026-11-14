"use client";

import { useEffect } from "react";

/**
 * Counts a view once the page has actually been opened in a browser (not on
 * prefetch or by crawlers that don't run scripts). The server dedupes per
 * visitor and day, so remounts and reloads don't inflate the count.
 */
export function ViewTracker({ id, locale }: { id: string; locale: string }) {
  useEffect(() => {
    const body = JSON.stringify({ id, locale });
    const sent = navigator.sendBeacon?.("/api/views", new Blob([body], { type: "application/json" }));
    if (!sent) {
      fetch("/api/views", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(
        () => {}
      );
    }
  }, [id, locale]);
  return null;
}
