"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowDown, ArrowUp, Plus, X } from "lucide-react";

export interface PickablePiece {
  id: string;
  kind: "article" | "post";
  slug: string;
  title: string;
  /** Whether any language is published; unpublished parts are hidden from readers. */
  published: boolean;
}

interface SeriesItemsProps {
  items: string[];
  onChange: (items: string[]) => void;
  pieces: PickablePiece[];
}

/** Series builder: pick existing articles and posts, order them, spot dangling ids. */
export default function SeriesItems({ items, onChange, pieces }: SeriesItemsProps) {
  const t = useTranslations("Editor");
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? pieces.filter((p) => !items.includes(p.id) && `${p.title} ${p.slug}`.toLowerCase().includes(q)).slice(0, 8)
    : [];

  const move = (index: number, by: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <ol className="space-y-1.5">
        {items.map((id, index) => {
          const piece = byId.get(id);
          return (
            <li key={id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
              <span className="w-5 text-right text-xs text-muted-foreground">{index + 1}.</span>
              <span className="min-w-0 flex-1">
                {piece ? (
                  <>
                    <span className="block truncate font-medium">{piece.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("kind", { kind: piece.kind })} · {piece.slug}
                      {!piece.published && <> · {t("hiddenUntilPublished")}</>}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={14} />
                    {t("danglingItem", { id })}
                  </span>
                )}
              </span>
              <button
                type="button"
                aria-label={t("moveUp")}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label={t("moveDown")}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                aria-label={t("remove")}
                onClick={() => onChange(items.filter((i) => i !== id))}
                className="rounded p-1 hover:bg-muted"
              >
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ol>
      {items.length === 0 && <p className="text-sm text-muted-foreground">{t("noItems")}</p>}

      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPieces")}
          className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        {matches.length > 0 && (
          <ul className="mt-1 overflow-hidden rounded-lg border border-border/60">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...items, p.id]);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Plus size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{p.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{t("kind", { kind: p.kind })}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
