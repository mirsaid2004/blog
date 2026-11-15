import type { ComponentProps } from "react";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import { Link2 } from "lucide-react";
import { assetUrl, isPrivateAsset } from "@/lib/assets";
import { cn } from "@/lib/utils";

type HeadingProps = ComponentProps<"h2">;

/** Heading with a hover anchor link; scroll-margin keeps it clear of the fixed navbar. */
function heading(Tag: "h2" | "h3" | "h4", className: string) {
  function Heading({ id, children, className: extra, ...props }: HeadingProps) {
    return (
      <Tag id={id} className={cn("group scroll-mt-28 font-bold tracking-tight text-foreground", className, extra)} {...props}>
        {id ? (
          <a href={`#${id}`} className="inline-flex items-center gap-2 no-underline">
            {children}
            <Link2
              aria-hidden
              className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
        ) : (
          children
        )}
      </Tag>
    );
  }
  Heading.displayName = Tag;
  return Heading;
}

/** Element styles for article bodies. Code blocks are styled in globals.css (.article-body). */
export const mdxComponents: MDXComponents = {
  h2: heading("h2", "mt-14 mb-4 text-2xl md:text-3xl"),
  h3: heading("h3", "mt-10 mb-3 text-xl"),
  h4: heading("h4", "mt-8 mb-2 text-lg"),
  p: (props) => <p className="my-5 leading-7 text-foreground/85" {...props} />,
  a: ({ className, ...props }) => (
    <a
      className={cn("font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary", className)}
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  ul: (props) => <ul className="my-5 list-disc space-y-2 pl-6 marker:text-muted-foreground" {...props} />,
  ol: (props) => <ol className="my-5 list-decimal space-y-2 pl-6 marker:text-muted-foreground" {...props} />,
  li: (props) => <li className="leading-7 text-foreground/85 [&>p]:my-2" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-6 border-l-2 border-primary/60 pl-5 italic text-muted-foreground [&>p]:my-2" {...props} />
  ),
  hr: () => <hr className="my-12 border-border" />,
  table: (props) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-border bg-muted/50 px-4 py-2.5 text-left font-semibold" {...props} />,
  td: (props) => <td className="border-b border-border px-4 py-2.5 align-top text-foreground/85 [tr:last-child_&]:border-b-0" {...props} />,
  // Markdown `![alt](src)`: size unknown, so a plain lazy <img>. Prefer <Img> for R2 images.
  img: ({ alt = "", src, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={typeof src === "string" ? assetUrl(src) : src}
      className="my-8 rounded-xl border border-border"
      loading="lazy"
      {...props}
    />
  ),
  Img,
};

interface ImgProps {
  /** R2 key (`content/<id>/<hash>.webp`), a site path, or an absolute URL. */
  src: string;
  alt: string;
  /** Intrinsic size, so the page doesn't shift while the image loads. */
  width: number;
  height: number;
  caption?: string;
}

/** `<Img src="content/<id>/<hash>.webp" width={1600} height={900} alt="…" />` in MDX. */
function Img({ src, alt, width, height, caption }: ImgProps) {
  const image = (
    <Image
      src={assetUrl(src)}
      alt={alt}
      width={width}
      height={height}
      sizes="(min-width: 768px) 720px, 100vw"
      // The image optimizer can't fetch private note images (they need the admin's session).
      unoptimized={isPrivateAsset(src)}
      className="h-auto w-full rounded-xl border border-border"
    />
  );
  if (!caption) return <div className="my-8">{image}</div>;
  return (
    <figure className="my-8">
      {image}
      <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
