import { cache } from "react";
import type { MDXComponents } from "mdx/types";
import { evaluate } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import type { Locale } from "next-intl";
import { loadContent } from "./source";
import type { ContentType } from "./types";

/** One heading in a piece's table of contents. */
export interface TocItem {
  id: string;
  title: string;
  /** Heading level: 2 for h2, 3 for h3, ... */
  depth: number;
}

const TOC_DEPTHS = new Set([2, 3, 4]);

const prettyCode: PrettyCodeOptions = {
  // Both themes are emitted as CSS variables; globals.css picks one per color scheme.
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
};

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

/**
 * Compile a piece's MDX body in `locale`, which must be a language the piece has
 * (the item's resolved `locale`). Returns null while the body is still empty.
 */
export const getContentBody = cache(
  async (type: ContentType, slug: string, locale: Locale, components: MDXComponents) => {
    const piece = loadContent().pieces.find((p) => p.type === type && p.slug === slug);
    const body = piece?.translations[locale]?.body;
    if (!body) return null;

    const toc: TocItem[] = [];
    const { content, error } = await evaluate({
      source: body,
      components,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCode], rehypeCollectToc(toc)],
        },
      },
    });
    if (error) throw error;

    return { content, toc };
  }
);
