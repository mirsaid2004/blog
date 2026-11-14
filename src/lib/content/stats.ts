/**
 * Mock views and ratings, keyed by content id. Neon replaces this in Phase 4
 * (see PLAN.md); the content itself lives in content/.
 */
import type { ContentStats } from "./types";

const STATS: Record<string, ContentStats> = {
  "a-zero-cost": { views: 1200, rating: 4.8, ratingCount: 74 },
  "a-isomorphic-security": { views: 3400, rating: 4.9, ratingCount: 120 },
  "a-observability-gap": { views: 900, rating: 4.7, ratingCount: 56 },
  "a-cpu-caches": { views: 5100, rating: 5, ratingCount: 210 },
  "a-custom-allocator": { views: 2200, rating: 4.6, ratingCount: 45 },
  "a-wasm": { views: 4800, rating: 4.9, ratingCount: 180 },
  "p-edge-runtimes": { views: 8500, rating: 4.9, ratingCount: 312 },
  "p-redux": { views: 5200, rating: 4.5, ratingCount: 145 },
  "p-turborepo": { views: 3100, rating: 4.8, ratingCount: 89 },
  "p-vim": { views: 6700, rating: 4.7, ratingCount: 210 },
  "p-docker-node": { views: 12000, rating: 4.9, ratingCount: 440 },
  "p-senior": { views: 25000, rating: 5, ratingCount: 850 },
  "s-systems-perf": { views: 9800, rating: 4.9, ratingCount: 260 },
  "s-hardening": { views: 6400, rating: 4.8, ratingCount: 140 },
  "s-modern-tooling": { views: 4100, rating: 4.7, ratingCount: 95 },
  "s-distributed": { views: 3300, rating: 4.6, ratingCount: 61 },
};

const EMPTY: ContentStats = { views: 0, rating: 0, ratingCount: 0 };

export function getStats(id: string): ContentStats {
  return STATS[id] ?? EMPTY;
}
