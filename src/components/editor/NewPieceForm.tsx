"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, routing, useRouter } from "@/i18n/routing";
import { checkSlug } from "@/lib/editor/actions";
import { FOLDERS, kindOf, SLUG, type Folder } from "@/lib/editor/format";

const inputClass =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

/** Lowercase Latin slug from a title (Cyrillic is transliterated roughly). */
function slugify(text: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "",
    ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function NewPieceForm() {
  const t = useTranslations("Editor");
  const router = useRouter();
  const [folder, setFolder] = useState<Folder>("articles");
  const [slug, setSlug] = useState("");
  const [lang, setLang] = useState<string>("en");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!SLUG.test(slug)) return setError(t("slugInvalid"));
    setPending(true);
    const result = await checkSlug({ folder, slug });
    if (!result.ok) {
      setPending(false);
      return setError(result.error);
    }
    if (!result.available) {
      setPending(false);
      return setError(t("slugTaken"));
    }
    router.push(`/admin/edit/${folder}/${slug}?lang=${lang}`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 pb-24 pt-36">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} />
        {t("back")}
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("newPiece")}</h1>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("type")}</span>
          <select className={inputClass} value={folder} onChange={(e) => setFolder(e.target.value as Folder)}>
            {FOLDERS.map((f) => (
              <option key={f} value={f}>
                {t("kind", { kind: kindOf(f) })}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("slug")}</span>
          <input
            className={`${inputClass} font-mono`}
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value) + (e.target.value.endsWith(" ") || e.target.value.endsWith("-") ? "-" : ""));
              setError(null);
            }}
            placeholder="distributed-sagas"
            required
          />
          <span className="mt-1 block text-xs text-muted-foreground">{t("slugHint")}</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("originalLocale")}</span>
          <select className={inputClass} value={lang} onChange={(e) => setLang(e.target.value)}>
            {routing.locales.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !slug}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          {t("create")}
        </button>
      </form>
    </main>
  );
}
