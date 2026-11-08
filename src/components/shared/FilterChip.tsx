import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  /** Optional result count shown after the label. */
  count?: number;
  /** Replace the history entry instead of pushing a new one. */
  replace?: boolean;
  className?: string;
}

/** Selectable filter badge (topics, categories). Navigates via the URL so state is shareable. */
export default function FilterChip({ href, active, children, count, replace = true, className }: FilterChipProps) {
  return (
    <NextLink
      href={href}
      scroll={false}
      replace={replace}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground",
        className
      )}
    >
      {children}
      {count !== undefined && <span className="ml-1.5 tabular-nums opacity-60">{count}</span>}
    </NextLink>
  );
}
