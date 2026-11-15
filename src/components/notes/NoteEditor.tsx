"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "next-intl";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Check, Loader2, Lock, Plus, Save, Trash2, X } from "lucide-react";
import { Link, routing, useRouter } from "@/i18n/routing";
import { changedFiles } from "@/lib/editor/format";
import {
  deleteNote,
  loadNoteHistory,
  loadNoteVersion,
  requestNoteUpload,
  saveNote,
} from "@/lib/notes/actions";
import { newNote, noteIssues, parseNote, serializeNote, type NoteDoc, type NoteFiles } from "@/lib/notes/format";
import type { NoteShas } from "@/lib/notes/repo";
import { cn } from "@/lib/utils";
import CodeEditor, { type CodeEditorHandle } from "@/components/editor/CodeEditor";
import HistoryPanel from "@/components/editor/HistoryPanel";
import { imgTag, uploadImage, type RequestTicket } from "@/components/editor/images";
import { clearLocalDraft, readLocalDraft, writeLocalDraft, type LocalDraft } from "@/components/editor/local-draft";
import Preview from "@/components/editor/Preview";

interface NoteEditorProps {
  slug: string;
  /** The note's files on main ({} for a new note). */
  files: NoteFiles;
  shas: NoteShas;
  initialLocale: Locale;
}

const IDLE_COMMIT_MS = 60_000;
const inputClass =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";
const button =
  "inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-50";

/**
 * Editor for a private note. Simpler than the piece editor: notes are saved
 * straight to main (no drafts, publishing or statuses), and their images go to
 * the private bucket.
 */
export default function NoteEditor({ slug, files, shas: initialShas, initialLocale }: NoteEditorProps) {
  const t = useTranslations("Notes");
  const te = useTranslations("Editor");
  const uiLocale = useLocale();
  const router = useRouter();
  const storageKey = `notes/${slug}`;
  const isNew = Object.keys(files).length === 0;

  const initialDoc = useMemo(() => (isNew ? newNote(initialLocale) : parseNote(files, initialLocale)), [files, initialLocale, isNew]);
  const [doc, setDoc] = useState<NoteDoc>(initialDoc);
  const [baseline, setBaseline] = useState<NoteFiles>(() => (isNew ? {} : serializeNote(initialDoc)));
  const [shas, setShas] = useState(initialShas);
  const [active, setActive] = useState<Locale>(initialDoc.meta.originalLocale);
  const [panel, setPanel] = useState<"preview" | "history">("preview");
  const [busy, setBusy] = useState<null | "save" | "delete">(null);
  const [confirm, setConfirm] = useState<null | "delete" | `remove-${string}`>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCommit, setAutoCommit] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [recovered, setRecovered] = useState<LocalDraft<NoteDoc> | null>(null);
  const [uploads, setUploads] = useState(0);
  const [tagsText, setTagsText] = useState(initialDoc.meta.tags.join(", "));
  const editorRef = useRef<CodeEditorHandle>(null);

  const current = useMemo(() => serializeNote(doc), [doc]);
  const changes = useMemo(() => changedFiles(baseline, current), [baseline, current]);
  const dirty = Object.keys(changes).length > 0;
  const issues = useMemo(() => noteIssues(current), [current]);
  const original = doc.meta.originalLocale;
  const translation = doc.translations[active];

  const updateTranslation = (locale: Locale, patch: Partial<{ title: string; body: string }>) =>
    setDoc((d) => ({ ...d, translations: { ...d.translations, [locale]: { ...d.translations[locale]!, ...patch } } }));

  // --- local recovery --------------------------------------------------------------

  useEffect(() => {
    readLocalDraft<NoteDoc>(storageKey).then((draft) => {
      if (!draft) return;
      if (Object.keys(changedFiles(serializeNote(initialDoc), serializeNote(draft.doc))).length) setRecovered(draft);
      else clearLocalDraft(storageKey);
    });
  }, [storageKey, initialDoc]);

  useEffect(() => {
    if (recovered) return;
    const timer = setTimeout(() => {
      if (dirty) writeLocalDraft<NoteDoc>(storageKey, { doc, head: JSON.stringify(shas), savedAt: Date.now() });
      else clearLocalDraft(storageKey);
    }, 800);
    return () => clearTimeout(timer);
  }, [doc, dirty, shas, storageKey, recovered]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // --- save / delete -----------------------------------------------------------------

  const save = useCallback(
    async (auto = false) => {
      if (busy || !dirty || issues.length) return;
      const snapshot = current;
      setBusy("save");
      const result = await saveNote({ slug, expected: shas, files: snapshot, changes, auto });
      setBusy(null);
      if (result.ok) {
        setShas(result.shas);
        setBaseline(snapshot);
        setSavedAt(Date.now());
        setError(null);
      } else {
        setError(result.error);
        if (result.conflict) setAutoCommit(false);
      }
    },
    [busy, dirty, issues.length, current, slug, shas, changes]
  );

  useEffect(() => {
    if (!autoCommit || !dirty || recovered || issues.length) return;
    const timer = setTimeout(() => save(true), IDLE_COMMIT_MS);
    return () => clearTimeout(timer);
  }, [autoCommit, dirty, current, recovered, issues.length, save]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  async function remove() {
    setConfirm(null);
    if (isNew && Object.keys(shas).length === 0) {
      await clearLocalDraft(storageKey);
      return router.push("/admin/notes");
    }
    setBusy("delete");
    const result = await deleteNote({ slug, noteId: doc.meta.id, expected: shas });
    setBusy(null);
    if (!result.ok) return setError(result.error);
    await clearLocalDraft(storageKey);
    router.push("/admin/notes");
  }

  // --- images ------------------------------------------------------------------------

  const requestTicket: RequestTicket = (image) => requestNoteUpload({ noteId: doc.meta.id, ...image });

  async function insertImages(images: File[], pos: number) {
    setUploads((n) => n + images.length);
    for (const file of images) {
      try {
        editorRef.current?.insert(`${imgTag(await uploadImage(file, requestTicket))}\n`, pos);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploads((n) => n - 1);
      }
    }
  }

  // --- render --------------------------------------------------------------------------

  const status =
    uploads > 0
      ? te("uploading", { count: uploads })
      : busy === "save"
        ? te("saving")
        : dirty
          ? te("unsaved")
          : savedAt
            ? te("savedAt", { time: new Intl.DateTimeFormat(uiLocale, { timeStyle: "short" }).format(savedAt) })
            : isNew
              ? t("notSaved")
              : te("upToDate");
  const activeFile = `${active}.mdx`;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-24 pt-28 md:px-6">
      <div className="sticky top-20 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            {t("title")}
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{doc.translations[original]?.title || slug}</h1>
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Lock size={12} />
              notes/{slug}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground" role="status">
              {status}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground" title={te("autoCommitHint")}>
              <input type="checkbox" checked={autoCommit} onChange={(e) => setAutoCommit(e.target.checked)} />
              {te("autoCommit")}
            </label>
            <button type="button" className={button} disabled={!dirty || busy !== null || issues.length > 0} onClick={() => save()}>
              {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {te("save")}
            </button>
            {confirm === "delete" ? (
              <span className="inline-flex items-center gap-1">
                <button type="button" className={cn(button, "border-destructive bg-destructive text-white hover:text-white")} onClick={remove}>
                  <Trash2 size={15} />
                  {t("confirmDelete")}
                </button>
                <button type="button" aria-label={te("cancel")} className={button} onClick={() => setConfirm(null)}>
                  <X size={15} />
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={cn(button, "hover:border-destructive/50 hover:text-destructive")}
                disabled={busy !== null}
                onClick={() => setConfirm("delete")}
              >
                {busy === "delete" ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {t("delete")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-3 empty:hidden">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <pre className="flex-1 whitespace-pre-wrap font-sans">{error}</pre>
            <button type="button" aria-label={te("dismiss")} onClick={() => setError(null)}>
              <X size={15} />
            </button>
          </div>
        )}
        {recovered && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <span className="flex-1">
              {te("recovered", {
                time: new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium", timeStyle: "short" }).format(recovered.savedAt),
              })}
            </span>
            <button
              type="button"
              className={button}
              onClick={() => {
                setDoc(recovered.doc);
                setTagsText(recovered.doc.meta.tags.join(", "));
                setRecovered(null);
              }}
            >
              {te("restoreLocal")}
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                clearLocalDraft(storageKey);
                setRecovered(null);
              }}
            >
              {te("dismiss")}
            </button>
          </div>
        )}
        {issues.length > 0 && dirty && (
          <ul className="rounded-xl border border-border/60 p-3 text-xs text-destructive">
            {issues.map((issue) => (
              <li key={issue} className="whitespace-pre-wrap">
                {issue}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-[1fr_12rem]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{te("tags")}</span>
          <input
            className={inputClass}
            value={tagsText}
            onChange={(e) => {
              setTagsText(e.target.value);
              const tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
              setDoc((d) => ({ ...d, meta: { ...d.meta, tags } }));
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{te("originalLocale")}</span>
          <select
            className={inputClass}
            value={original}
            onChange={(e) => setDoc((d) => ({ ...d, meta: { ...d.meta, originalLocale: e.target.value as Locale } }))}
          >
            {routing.locales
              .filter((l) => doc.translations[l])
              .map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label={te("languages")}>
        {routing.locales.map((locale) =>
          doc.translations[locale] ? (
            <button
              key={locale}
              type="button"
              role="tab"
              aria-selected={active === locale}
              onClick={() => setActive(locale)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active === locale ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-primary/40"
              )}
            >
              {locale.toUpperCase()}
              {locale === original && <span title={te("original")}>★</span>}
            </button>
          ) : (
            <button
              key={locale}
              type="button"
              onClick={() => {
                setDoc((d) => ({ ...d, translations: { ...d.translations, [locale]: { title: "", body: "" } } }));
                setActive(locale);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <Plus size={14} />
              {te("addTranslation", { locale: locale.toUpperCase() })}
            </button>
          )
        )}
      </div>

      {translation && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">{te("title")}</span>
              <input
                className={inputClass}
                lang={active}
                value={translation.title}
                onChange={(e) => updateTranslation(active, { title: e.target.value })}
              />
            </label>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{te("body")}</span>
                <span className="text-xs text-muted-foreground">{te("bodyHint")}</span>
              </div>
              <CodeEditor
                key={active}
                ref={editorRef}
                value={translation.body}
                onChange={(body) => updateTranslation(active, { body })}
                onImages={insertImages}
                placeholder={te("bodyPlaceholder")}
                ariaLabel={te("body")}
                className="min-h-[60vh] overflow-hidden rounded-xl border border-border/60 bg-background focus-within:border-primary/60 [&_.cm-editor]:min-h-[60vh]"
              />
            </div>
            {active !== original &&
              (confirm === `remove-${active}` ? (
                <span className="inline-flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    className={cn(button, "border-destructive text-destructive")}
                    onClick={() => {
                      setDoc((d) => {
                        const translations = { ...d.translations };
                        delete translations[active];
                        return { ...d, translations };
                      });
                      setActive(original);
                      setConfirm(null);
                    }}
                  >
                    <Check size={14} />
                    {te("confirmRemoveTranslation", { locale: active.toUpperCase() })}
                  </button>
                  <button type="button" className={button} onClick={() => setConfirm(null)}>
                    {te("cancel")}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirm(`remove-${active}`)}
                >
                  {te("removeTranslation", { locale: active.toUpperCase() })}
                </button>
              ))}
          </div>

          <div className="min-w-0">
            <div className="sticky top-40">
              <div className="mb-3 flex gap-1 rounded-full border border-border/60 p-1 text-sm" role="tablist">
                {(["preview", "history"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={panel === p}
                    onClick={() => setPanel(p)}
                    className={cn(
                      "flex-1 rounded-full px-3 py-1 transition-colors",
                      panel === p ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {te("panel", { panel: p })}
                  </button>
                ))}
              </div>
              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto rounded-2xl border border-border/60 bg-card/40 p-5">
                {panel === "preview" && <Preview source={translation.body} lang={active} />}
                {panel === "history" &&
                  (shas[activeFile] ? (
                    <HistoryPanel
                      key={`${activeFile}-${shas[activeFile]}`}
                      loadEntries={() => loadNoteHistory({ slug, file: activeFile })}
                      loadText={(sha) => loadNoteVersion({ slug, file: activeFile, sha })}
                      current={current[activeFile] ?? ""}
                      onRestore={(text) => {
                        const restored = parseNote({ ...current, [activeFile]: text }, original);
                        setDoc((d) => ({ ...d, translations: { ...d.translations, [active]: restored.translations[active] } }));
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{te("noHistory")}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
