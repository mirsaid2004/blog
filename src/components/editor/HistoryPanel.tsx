"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { History, RotateCcw } from "lucide-react";
import type { HistoryEntry } from "@/lib/editor/repo";
import { cn } from "@/lib/utils";
import DiffView from "./DiffView";

type Loaded<T> = Promise<({ ok: true } & T) | { ok: false; error: string }>;

interface HistoryPanelProps {
  /** Commits that touched the open file (from the draft branch or main). */
  loadEntries: () => Loaded<{ entries: HistoryEntry[] }>;
  /** The file's text at a commit, or null if it didn't exist then. */
  loadText: (sha: string) => Loaded<{ text: string | null }>;
  /** The file as it is in the editor now, to diff against. */
  current: string;
  onRestore: (text: string) => void;
}

/** Commits that touched a file; pick one to see its diff against the editor and restore it. */
/** Remount it (with a `key`) to load another file's history. */
export default function HistoryPanel({ loadEntries, loadText, current, onRestore }: HistoryPanelProps) {
  const t = useTranslations("Editor");
  const locale = useLocale();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ sha: string; text: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadEntries().then((result) => {
      if (cancelled) return;
      if (result.ok) setEntries(result.entries);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
    // Loaded once per mount; the parent remounts the panel for another file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function select(sha: string) {
    const result = await loadText(sha);
    if (result.ok) setSelected({ sha, text: result.text });
    else setError(result.error);
  }

  const format = (date: string) =>
    date ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)) : "";

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!entries) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  if (!entries.length) return <p className="text-sm text-muted-foreground">{t("noHistory")}</p>;

  return (
    <div className="space-y-4">
      <ol className="max-h-64 space-y-1 overflow-y-auto">
        {entries.map((entry) => (
          <li key={entry.sha}>
            <button
              type="button"
              onClick={() => select(entry.sha)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                selected?.sha === entry.sha && "bg-primary/10"
              )}
            >
              <History size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{entry.message}</span>
                <span className="block text-xs text-muted-foreground">
                  <span className="font-mono">{entry.sha.slice(0, 7)}</span> · {entry.author} · {format(entry.date)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {selected && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t("diffAgainstEditor", { sha: selected.sha.slice(0, 7) })}</p>
            {selected.text !== null && (
              <button
                type="button"
                onClick={() => onRestore(selected.text!)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-medium hover:border-primary/50 hover:text-primary"
              >
                <RotateCcw size={12} />
                {t("restore")}
              </button>
            )}
          </div>
          {selected.text === null ? (
            <p className="text-sm text-muted-foreground">{t("fileMissingThen")}</p>
          ) : (
            <DiffView before={selected.text} after={current} />
          )}
        </div>
      )}
    </div>
  );
}
