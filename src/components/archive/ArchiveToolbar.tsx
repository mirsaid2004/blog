"use client";

import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SORT_KEYS, type SortKey } from "@/lib/content/types";
import FilterChip from "@/components/shared/FilterChip";
import SearchField from "@/components/shared/SearchField";
import { useUrlSearchQuery } from "@/components/shared/use-url-search-query";

interface ArchiveToolbarProps {
  tags: { tag: string; count: number }[];
  resultCount: number;
}

export default function ArchiveToolbar({ tags, resultCount }: ArchiveToolbarProps) {
  const t = useTranslations("Archive.common");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { query, setQuery, urlQuery, isPending, reset } = useUrlSearchQuery("q");

  const activeTag = searchParams.get("tag");
  const sortParam = searchParams.get("sort") as SortKey | null;
  const activeSort: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : "latest";

  const hrefWith = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const hasFilters = Boolean(urlQuery || activeTag || activeSort !== "latest");

  return (
    <div className="mb-10 flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchField
          value={query}
          onValueChange={setQuery}
          pending={isPending}
          placeholder={t("searchPlaceholder")}
          label={t("searchLabel")}
          clearLabel={t("clearFilters")}
          className="flex-1"
        />

        <nav
          aria-label={t("sortLabel")}
          className="flex h-12 shrink-0 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm"
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
                  "flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors md:flex-none",
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
              <FilterChip href={hrefWith({ tag: null })} active={!activeTag}>
                {t("allTopics")}
              </FilterChip>
            </li>
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <FilterChip
                  href={hrefWith({ tag: activeTag === tag ? null : tag })}
                  active={activeTag === tag}
                  count={count}
                >
                  #{tag}
                </FilterChip>
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
              onClick={reset}
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
