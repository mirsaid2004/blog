import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { MDXComponents } from "mdx/types";
import { evaluate } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import type { ContentType } from "./types";

/** One heading in a piece's table of contents. */
export interface TocItem {
  id: string;
  title: string;
  /** Heading level: 2 for h2, 3 for h3, ... */
  depth: number;
}

/**
 * Local stand-in for the GitHub content repo (see PLAN.md): one folder per piece,
 * one file per language, e.g. content/articles/<slug>/en.mdx.
 */
const CONTENT_ROOT = path.join(process.cwd(), "content");
const DEFAULT_LOCALE = "en";
const TOC_DEPTHS = new Set([2, 3, 4]);

const prettyCode: PrettyCodeOptions = {
  // Both themes are emitted as CSS variables; globals.css picks one per color scheme.
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
};

/** Read the body for a locale, falling back to the default language. */
async function readSource(type: ContentType, slug: string, locale: string) {
  const dir = path.join(CONTENT_ROOT, `${type}s`, slug);
  for (const lang of locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE]) {
    try {
      return { source: await readFile(path.join(dir, `${lang}.mdx`), "utf8"), locale: lang };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return null;
}

// Minimal hast shapes; enough to walk headings without pulling in @types/hast.
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const textOf = (node: HastNode): string =>
  node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(textOf).join("");

/** Rehype plugin (runs after rehype-slug) that collects h2-h4 into `toc`. */
function rehypeCollectToc(toc: TocItem[]) {
  return () => (tree: HastNode) => {
    const visit = (node: HastNode) => {
      const depth = node.tagName?.match(/^h([1-6])$/)?.[1];
      if (node.type === "element" && depth && TOC_DEPTHS.has(Number(depth))) {
        const id = node.properties?.id;
        if (typeof id === "string") toc.push({ id, title: textOf(node).trim(), depth: Number(depth) });
        return;
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

/** Compile a piece's MDX body. Returns null when the piece has no body in any language. */
export const getContentBody = cache(
  async (type: ContentType, slug: string, locale: string, components: MDXComponents) => {
    const file = await readSource(type, slug, locale);
    if (!file) return null;

    const toc: TocItem[] = [];
    const { content, error } = await evaluate({
      source: file.source,
      components,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCode], rehypeCollectToc(toc)],
        },
      },
    });
    if (error) throw error;

    return { content, toc, locale: file.locale };
  }
);
