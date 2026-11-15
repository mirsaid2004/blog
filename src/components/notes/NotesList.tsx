"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Lock, Plus } from "lucide-react";
import { Link, routing, useRouter } from "@/i18n/routing";
import { SLUG } from "@/lib/editor/format";
import { checkNoteSlug } from "@/lib/notes/actions";
import type { NoteSummary } from "@/lib/notes/repo";

const inputClass =
  "rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

export function NotesList({ notes }: { notes: NoteSummary[] }) {
  const t = useTranslations("Notes");
  const te = useTranslations("Editor");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState("");
  const [lang, setLang] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const q = query.trim().toLowerCase();
  const shown = q ? notes.filter((n) => `${n.title} ${n.slug} ${n.tags.join(" ")}`.toLowerCase().includes(q)) : notes;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!SLUG.test(slug)) return setError(te("slugInvalid"));
    setPending(true);
    const result = await checkNoteSlug(slug);
    setPending(false);
    if (!result.ok) return setError(result.error);
    if (!result.available) return setError(t("slugTaken"));
    router.push(`/admin/notes/${slug}?lang=${lang}`);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="flex flex-wrap items-end gap-2 rounded-2xl border border-border/60 bg-card/60 p-4">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("newSlug")}</span>
          <input
            className={`${inputClass} w-full font-mono`}
            value={slug}
            placeholder="reading-list"
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              setError(null);
            }}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{te("originalLocale")}</span>
          <select className={inputClass} value={lang} onChange={(e) => setLang(e.target.value)}>
            {routing.locales.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending || !slug}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {t("new")}
        </button>
        {error && (
          <p role="alert" className="w-full text-sm text-destructive">
            {error}
          </p>
        )}
      </form>

      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className={`${inputClass} mb-3 w-full`}
        />
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">{notes.length ? t("noMatches") : t("empty")}</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-2xl border border-border/60">
            {shown.map((note) => (
              <li key={note.slug}>
                <Link href={`/admin/notes/${note.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  <Lock size={14} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{note.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {note.slug}
                      {note.tags.length > 0 && <> · {note.tags.join(", ")}</>}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {note.languages.map((l) => l.toUpperCase()).join(" ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
