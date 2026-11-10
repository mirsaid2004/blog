import { ChevronDown, TextAlignStart } from "lucide-react";
import type { TocItem } from "@/lib/content/mdx";

/** Collapsible "On this page" list for screens without the side rail. */
export default function MobileToc({ items, title }: { items: TocItem[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <details className="group mb-10 rounded-2xl border border-border bg-card/60 backdrop-blur-md xl:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
        <TextAlignStart className="h-4 w-4" aria-hidden />
        {title}
        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="border-t border-border px-4 py-3 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              style={{ paddingLeft: (item.depth - 2) * 14 }}
              className="block py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
