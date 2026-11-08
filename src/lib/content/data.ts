/**
 * Mock content. This is the single place content comes from until the
 * GitHub-backed content layer (see PLAN.md) replaces it.
 */
import type { ContentItem, Series } from "./types";

const PHOTO =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KAlrHuDKVF06-cRNaeXcPzB5pbLgqSc-_g&s";
const PLACEHOLDER = "/series-placeholder.svg";

export const ARTICLES: ContentItem[] = [
  {
    id: "a-zero-cost",
    type: "article",
    slug: "zero-cost-abstractions",
    title: "Architecting Zero-Cost Abstractions in Systems Languages",
    summary:
      "How to leverage modern compiler intrinsics to build safer APIs without the runtime overhead.",
    publishedAt: "2023-11-24",
    readMinutes: 12,
    tags: ["systems", "architecture"],
    cover: PHOTO,
    views: 1200,
    rating: 4.8,
    ratingCount: 74,
  },
  {
    id: "a-isomorphic-security",
    type: "article",
    slug: "isomorphic-security",
    title: "Isomorphic Security: Hardening the Full Stack",
    summary:
      "Implementing unified security policies that transition seamlessly from frontend state to backend database constraints.",
    publishedAt: "2023-10-14",
    readMinutes: 22,
    tags: ["security", "fullstack"],
    cover: PHOTO,
    views: 3400,
    rating: 4.9,
    ratingCount: 120,
  },
  {
    id: "a-observability-gap",
    type: "article",
    slug: "observability-gap",
    title: "The Observability Gap in Distributed Actors",
    summary:
      "Why conventional logging fails in asynchronous actor systems and how to trace messages across stateful bounds.",
    publishedAt: "2023-09-02",
    readMinutes: 8,
    tags: ["observability", "architecture"],
    cover: PLACEHOLDER,
    views: 900,
    rating: 4.7,
    ratingCount: 56,
  },
  {
    id: "a-cpu-caches",
    type: "article",
    slug: "cpu-caches",
    title: "Understanding CPU Caches & Memory Barriers",
    summary:
      "A deep dive into L1/L2 caches, cache lines, and how memory barriers prevent instruction reordering bugs.",
    publishedAt: "2023-08-15",
    readMinutes: 18,
    tags: ["performance", "systems"],
    cover: PHOTO,
    views: 5100,
    rating: 5.0,
    ratingCount: 210,
  },
  {
    id: "a-custom-allocator",
    type: "article",
    slug: "custom-allocator",
    title: "Building a Custom Allocator in C++",
    summary:
      "Step-by-step guide to writing a high-performance memory allocator for video game engines.",
    publishedAt: "2023-07-22",
    readMinutes: 30,
    tags: ["performance", "memory"],
    cover: PLACEHOLDER,
    views: 2200,
    rating: 4.6,
    ratingCount: 45,
  },
  {
    id: "a-wasm",
    type: "article",
    slug: "wasm-beyond-browser",
    title: "WebAssembly Beyond the Browser",
    summary:
      "Exploring WASI and how WebAssembly is becoming the universal runtime for cloud-native applications.",
    publishedAt: "2023-06-10",
    readMinutes: 14,
    tags: ["wasm", "cloud"],
    cover: PHOTO,
    views: 4800,
    rating: 4.9,
    ratingCount: 180,
  },
];

export const POSTS: ContentItem[] = [
  {
    id: "p-edge-runtimes",
    type: "post",
    slug: "edge-runtime-comparison",
    title: "Edge Runtime Comparison: Cloudflare vs. Vercel vs. Bun",
    summary:
      "A benchmark-driven look at cold start times, memory overhead, and ecosystem maturity.",
    publishedAt: "2023-12-05",
    readMinutes: 8,
    tags: ["performance", "cloud"],
    views: 8500,
    rating: 4.9,
    ratingCount: 312,
  },
  {
    id: "p-redux",
    type: "post",
    slug: "stop-using-redux",
    title: "Why I Stopped Using Redux",
    summary:
      "Moving from global state monoliths to composable, localized state with React Query and Zustand.",
    publishedAt: "2023-11-18",
    readMinutes: 6,
    tags: ["react", "state"],
    views: 5200,
    rating: 4.5,
    ratingCount: 145,
  },
  {
    id: "p-turborepo",
    type: "post",
    slug: "modern-monorepo-turborepo",
    title: "Setting up a Modern Monorepo with Turborepo",
    summary:
      "A quick guide to sharing TS configs, ESLint rules, and UI components across multiple Next.js apps.",
    publishedAt: "2023-10-29",
    readMinutes: 10,
    tags: ["tooling", "architecture"],
    views: 3100,
    rating: 4.8,
    ratingCount: 89,
  },
  {
    id: "p-vim",
    type: "post",
    slug: "vim-commands",
    title: "10 Vim Commands That Will Save You Hours",
    summary:
      "Stop reaching for the mouse. Here are the most impactful Vim motions for everyday text editing.",
    publishedAt: "2023-10-01",
    readMinutes: 5,
    tags: ["tooling", "productivity"],
    views: 6700,
    rating: 4.7,
    ratingCount: 210,
  },
  {
    id: "p-docker-node",
    type: "post",
    slug: "dockerizing-nodejs-api",
    title: "Dockerizing a Node.js API the Right Way",
    summary:
      "Multistage builds, non-root users, and caching node_modules for lightning-fast deployments.",
    publishedAt: "2023-09-14",
    readMinutes: 7,
    tags: ["docker", "security"],
    views: 12000,
    rating: 4.9,
    ratingCount: 440,
  },
  {
    id: "p-senior",
    type: "post",
    slug: "reality-senior-engineering",
    title: "The Reality of Senior Engineering",
    summary:
      "It's less about writing code and more about managing complexity, communication, and trade-offs.",
    publishedAt: "2023-08-30",
    readMinutes: 9,
    tags: ["career"],
    views: 25000,
    rating: 5.0,
    ratingCount: 850,
  },
];

export const SERIES: Series[] = [
  {
    id: "s-systems-perf",
    slug: "systems-performance",
    title: "Systems Performance from First Principles",
    summary:
      "From cache lines to custom allocators: how hardware shapes the code you write, and how to make it fast.",
    publishedAt: "2023-06-10",
    tags: ["performance", "systems"],
    cover: PLACEHOLDER,
    items: ["a-cpu-caches", "a-custom-allocator", "a-zero-cost", "p-edge-runtimes"],
    views: 9800,
    rating: 4.9,
    ratingCount: 260,
  },
  {
    id: "s-hardening",
    slug: "hardening-the-stack",
    title: "Hardening the Stack",
    summary:
      "Security that spans the whole system: containers, APIs and the policies that tie frontend and backend together.",
    publishedAt: "2023-09-14",
    tags: ["security", "fullstack"],
    cover: PHOTO,
    items: ["p-docker-node", "a-isomorphic-security"],
    views: 6400,
    rating: 4.8,
    ratingCount: 140,
  },
  {
    id: "s-modern-tooling",
    slug: "modern-tooling",
    title: "Modern Developer Tooling",
    summary:
      "The editor, monorepo and runtime choices that keep a small team shipping quickly.",
    publishedAt: "2023-10-01",
    tags: ["tooling"],
    cover: PLACEHOLDER,
    items: ["p-vim", "p-turborepo", "p-redux", "a-wasm"],
    views: 4100,
    rating: 4.7,
    ratingCount: 95,
  },
  {
    id: "s-distributed",
    slug: "distributed-systems-in-practice",
    title: "Distributed Systems in Practice",
    summary:
      "Observability, cloud runtimes and the architectural habits that keep distributed systems debuggable.",
    publishedAt: "2023-06-10",
    tags: ["architecture", "observability"],
    cover: PHOTO,
    items: ["a-wasm", "a-observability-gap", "p-senior"],
    views: 3300,
    rating: 4.6,
    ratingCount: 61,
  },
];
