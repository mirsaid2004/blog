"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "next-intl";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CloudUpload,
  ExternalLink,
  GitBranch,
  GitMerge,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Link, routing, useRouter } from "@/i18n/routing";
import { assetUrl } from "@/lib/assets";
import { parseContent } from "@/lib/content/parse";
import { discardDraft, loadBlob, publishDraft, saveDraft, updateDraftFromMain } from "@/lib/editor/actions";
import {
  changedFiles,
  draftBranch,
  gitBlobSha,
  kindOf,
  newDoc,
  parseDoc,
  serializeDoc,
  type DocMeta,
  type DocTranslation,
  type EditorDoc,
  type Folder,
  type PieceFiles,
} from "@/lib/editor/format";
import { cn } from "@/lib/utils";
import CodeEditor, { type CodeEditorHandle } from "./CodeEditor";
import DiffView from "./DiffView";
import HistoryPanel from "./HistoryPanel";
import { imgTag, uploadImage } from "./images";
import { clearLocalDraft, readLocalDraft, writeLocalDraft, type LocalDraft } from "./local-draft";
import Preview from "./Preview";
import SeriesItems, { type PickablePiece } from "./SeriesItems";

export interface EditorProps {
  folder: Folder;
  slug: string;
  /** Head of the draft branch, or null when there is no draft yet. */
  head: string | null;
  /** The files the editor starts from: the draft's, else main's, else none (new piece). */
  files: PieceFiles;
  /** The files on main, to show what publishing would change ({} when not on main). */
  mainFiles: PieceFiles;
  /** Original language of a new piece. */
  initialLocale: Locale;
  /** Files of this piece changed on main since the draft branched off. */
  mainChanges: string[];
  pieces: PickablePiece[];
  /** Just published (the page reloaded with `?published=1`). */
  justPublished?: boolean;
}

type Panel = "preview" | "original" | "changes" | "history";
type Notice = { tone: "ok" | "error"; text: string; href?: string } | null;

const IDLE_COMMIT_MS = 60_000;
const LOCAL_SAVE_MS = 800;

const inputClass =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function Editor({
  folder,
  slug,
  head: initialHead,
  files,
  mainFiles,
  initialLocale,
  mainChanges,
  pieces,
  justPublished = false,
}: EditorProps) {
  const t = useTranslations("Editor");
  const uiLocale = useLocale();
  const router = useRouter();
  const kind = kindOf(folder);
  const storageKey = `${folder}/${slug}`;
  const isNewPiece = Object.keys(mainFiles).length === 0;

  const initialDoc = useMemo(
    () => (Object.keys(files).length ? parseDoc(files, initialLocale) : newDoc(kind, initialLocale)),
    [files, initialLocale, kind]
  );
  const [doc, setDoc] = useState<EditorDoc>(initialDoc);
  // What's committed on the branch (or main), as the editor would serialize it, so
  // untouched files never show up as changed just because of formatting.
  const [baseline, setBaseline] = useState<PieceFiles>(() =>
    Object.keys(files).length ? serializeDoc(initialDoc, kind) : {}
  );
  const [head, setHead] = useState(initialHead);
  const [active, setActive] = useState<Locale>(initialDoc.meta.originalLocale);
  const [panel, setPanel] = useState<Panel>("preview");
  const [busy, setBusy] = useState<null | "save" | "publish" | "discard" | "merge">(null);
  const [confirm, setConfirm] = useState<null | "publish" | "discard" | `remove-${string}`>(null);
  const [notice, setNotice] = useState<Notice>(() =>
    justPublished
      ? {
          tone: "ok",
          text: t("published"),
          ...(Object.values(initialDoc.translations).some((tr) => tr?.status === "published") ? { href: `/${folder}/${slug}` } : {}),
        }
      : null
  );
  const [autoCommit, setAutoCommit] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [recovered, setRecovered] = useState<LocalDraft | null>(null);
  const [uploads, setUploads] = useState(0);
  const [tagsText, setTagsText] = useState(initialDoc.meta.tags.join(", "));
  const [originalSha, setOriginalSha] = useState<string | null>(null);
  const [outdatedDiff, setOutdatedDiff] = useState<{ before: string } | null>(null);
  const editorRef = useRef<CodeEditorHandle>(null);

  const current = useMemo(() => serializeDoc(doc, kind), [doc, kind]);
  const changes = useMemo(() => changedFiles(baseline, current), [baseline, current]);
  const dirty = Object.keys(changes).length > 0;
  const original = doc.meta.originalLocale;
  const translation = doc.translations[active];

  const issues = useMemo(() => {
    const map = new Map(Object.entries(current).map(([name, text]) => [`${folder}/${slug}/${name}`, text]));
    const { errors, warnings } = parseContent(map);
    // Series items are checked against the site's pieces in SeriesItems instead.
    return { errors, warnings: warnings.filter((w) => !w.message.startsWith("unknown item")) };
  }, [current, folder, slug]);

  // --- doc updates --------------------------------------------------------------

  const updateMeta = (patch: Partial<DocMeta>) => setDoc((d) => ({ ...d, meta: { ...d.meta, ...patch } }));
  const updateTranslation = useCallback(
    (locale: Locale, patch: Partial<DocTranslation>) =>
      setDoc((d) => ({ ...d, translations: { ...d.translations, [locale]: { ...d.translations[locale]!, ...patch } } })),
    []
  );

  function addTranslation(locale: Locale) {
    setDoc((d) => ({
      ...d,
      translations: {
        ...d.translations,
        [locale]: { title: "", summary: "", status: "draft", body: "", ...(originalSha ? { translatedFrom: originalSha } : {}) },
      },
    }));
    setActive(locale);
    setPanel("original");
  }

  function removeTranslation(locale: Locale) {
    setDoc((d) => {
      const translations = { ...d.translations };
      delete translations[locale];
      return { ...d, translations };
    });
    setActive(original);
    setConfirm(null);
  }

  // Restoring a file from history replaces that part of the doc.
  function restoreFile(name: string, text: string) {
    const restored = parseDoc({ ...current, [name]: text }, original);
    if (name === "meta.yml") {
      setDoc((d) => ({ ...d, meta: restored.meta }));
      setTagsText(restored.meta.tags.join(", "));
    } else {
      const locale = name.replace(".mdx", "") as Locale;
      setDoc((d) => ({ ...d, translations: { ...d.translations, [locale]: restored.translations[locale] } }));
    }
    setNotice({ tone: "ok", text: t("restored") });
  }

  // --- outdated translations -----------------------------------------------------

  const originalFile = current[`${original}.mdx`];
  useEffect(() => {
    let cancelled = false;
    if (originalFile === undefined) return;
    gitBlobSha(originalFile).then((sha) => !cancelled && setOriginalSha(sha));
    return () => {
      cancelled = true;
    };
  }, [originalFile]);

  const outdated =
    active !== original && translation?.translatedFrom && originalSha && translation.translatedFrom !== originalSha;

  async function showOutdatedDiff() {
    if (!translation?.translatedFrom) return;
    const result = await loadBlob(translation.translatedFrom);
    if (result.ok) setOutdatedDiff({ before: result.text });
    else setNotice({ tone: "error", text: result.error });
  }

  // --- local autosave and recovery ----------------------------------------------

  useEffect(() => {
    readLocalDraft(storageKey).then((draft) => {
      if (!draft) return;
      const changed = Object.keys(changedFiles(serializeDoc(initialDoc, kind), serializeDoc(draft.doc, kind))).length > 0;
      if (changed) setRecovered(draft);
      else clearLocalDraft(storageKey);
    });
  }, [storageKey, initialDoc, kind]);

  useEffect(() => {
    if (recovered) return; // don't overwrite the recoverable copy before it's been looked at
    const timer = setTimeout(() => {
      if (dirty) writeLocalDraft(storageKey, { doc, head, savedAt: Date.now() });
      else clearLocalDraft(storageKey);
    }, LOCAL_SAVE_MS);
    return () => clearTimeout(timer);
  }, [doc, dirty, head, storageKey, recovered]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // --- git actions --------------------------------------------------------------

  const save = useCallback(
    async (auto = false) => {
      if (busy || !dirty) return;
      const snapshot = current;
      setBusy("save");
      const result = await saveDraft({
        folder,
        slug,
        expectedHead: head,
        changes,
        ...(auto ? { message: `Autosave ${folder}/${slug}` } : {}),
      });
      setBusy(null);
      if (result.ok) {
        setHead(result.head);
        setBaseline(snapshot);
        setSavedAt(Date.now());
        if (!auto) setNotice(null);
      } else {
        setNotice({ tone: "error", text: result.error });
        if (result.conflict) setAutoCommit(false);
      }
    },
    [busy, dirty, current, folder, slug, head, changes]
  );

  // Idle commit: a minute after the last edit, save to the draft branch.
  useEffect(() => {
    if (!autoCommit || !dirty || recovered) return;
    const timer = setTimeout(() => save(true), IDLE_COMMIT_MS);
    return () => clearTimeout(timer);
  }, [autoCommit, dirty, current, recovered, save]);

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

  async function publish() {
    if (!head) return;
    setConfirm(null);
    setBusy("publish");
    const result = await publishDraft({ folder, slug, expectedHead: head });
    setBusy(null);
    if (!result.ok) return setNotice({ tone: "error", text: result.error });
    await clearLocalDraft(storageKey);
    // Reload from main; the editor remounts (its key is the branch head) and shows the notice.
    router.replace(`/admin/edit/${folder}/${slug}?published=1`);
    router.refresh();
  }

  async function discard() {
    setConfirm(null);
    setBusy("discard");
    const result = await discardDraft({ folder, slug });
    setBusy(null);
    if (!result.ok) return setNotice({ tone: "error", text: result.error });
    await clearLocalDraft(storageKey);
    if (isNewPiece) return router.push("/admin");
    // Back to the published version: the page reloads main and the editor remounts.
    router.refresh();
  }

  async function mergeMain() {
    setBusy("merge");
    const result = await updateDraftFromMain({ folder, slug });
    setBusy(null);
    if (!result.ok) return setNotice({ tone: "error", text: result.error });
    router.refresh();
  }

  // --- images -------------------------------------------------------------------

  const target = { folder, slug, contentId: doc.meta.id };

  async function insertImages(files: File[], pos: number) {
    setUploads((n) => n + files.length);
    for (const file of files) {
      try {
        const image = await uploadImage(file, target);
        editorRef.current?.insert(`${imgTag(image)}\n`, pos);
      } catch (error) {
        setNotice({ tone: "error", text: (error as Error).message });
      } finally {
        setUploads((n) => n - 1);
      }
    }
  }

  async function uploadCover(file: File) {
    setUploads((n) => n + 1);
    try {
      const { key } = await uploadImage(file, target);
      updateMeta({ cover: key });
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setUploads((n) => n - 1);
    }
  }

  // --- render -------------------------------------------------------------------

  const status = busy === "save"
    ? t("saving")
    : dirty
      ? t("unsaved")
      : savedAt
        ? t("savedAt", { time: new Intl.DateTimeFormat(uiLocale, { timeStyle: "short" }).format(savedAt) })
        : head
          ? t("upToDate")
          : t("noDraft");

  const button =
    "inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-50";
  const activeFile = `${active}.mdx`;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-24 pt-28 md:px-6">
      {/* Toolbar */}
      <div className="sticky top-20 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            {t("back")}
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{doc.translations[original]?.title || slug}</h1>
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              {head ? <GitBranch size={12} /> : null}
              {head ? `${draftBranch(folder, slug)} @ ${head.slice(0, 7)}` : `${folder}/${slug}`}
              {isNewPiece && <span className="rounded bg-primary/10 px-1.5 font-sans text-primary">{t("new")}</span>}
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground" role="status">
              {uploads > 0 ? t("uploading", { count: uploads }) : status}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground" title={t("autoCommitHint")}>
              <input type="checkbox" checked={autoCommit} onChange={(e) => setAutoCommit(e.target.checked)} />
              {t("autoCommit")}
            </label>
            <button type="button" className={button} disabled={!dirty || busy !== null} onClick={() => save()}>
              {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {t("save")}
            </button>

            {confirm === "publish" ? (
              <span className="inline-flex items-center gap-1">
                <button type="button" className={cn(button, "border-primary bg-primary text-primary-foreground hover:text-primary-foreground")} onClick={publish}>
                  <Check size={15} />
                  {t("confirmPublish")}
                </button>
                <button type="button" aria-label={t("cancel")} className={button} onClick={() => setConfirm(null)}>
                  <X size={15} />
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={cn(button, "border-primary/60 text-primary")}
                disabled={!head || dirty || busy !== null || issues.errors.length > 0}
                title={dirty ? t("saveFirst") : !head ? t("nothingToPublish") : undefined}
                onClick={() => {
                  setConfirm("publish");
                  setPanel("changes");
                }}
              >
                {busy === "publish" ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />}
                {t("publish")}
              </button>
            )}

            {confirm === "discard" ? (
              <span className="inline-flex items-center gap-1">
                <button type="button" className={cn(button, "border-destructive bg-destructive text-white hover:text-white")} onClick={discard}>
                  <Trash2 size={15} />
                  {t("confirmDiscard")}
                </button>
                <button type="button" aria-label={t("cancel")} className={button} onClick={() => setConfirm(null)}>
                  <X size={15} />
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={cn(button, "hover:border-destructive/50 hover:text-destructive")}
                disabled={(!head && !isNewPiece) || busy !== null}
                onClick={() => setConfirm("discard")}
              >
                {busy === "discard" ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {t("discard")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banners */}
      <div className="mb-6 space-y-3 empty:hidden">
        {notice && (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={cn(
              "flex items-start gap-2 rounded-xl border p-3 text-sm",
              notice.tone === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-500/30 bg-emerald-500/5"
            )}
          >
            <pre className="flex-1 whitespace-pre-wrap font-sans">{notice.text}</pre>
            {notice.href && (
              <Link href={notice.href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                {t("viewLive")}
                <ExternalLink size={13} />
              </Link>
            )}
            <button type="button" aria-label={t("dismiss")} onClick={() => setNotice(null)}>
              <X size={15} />
            </button>
          </div>
        )}
        {recovered && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <span className="flex-1">
              {t("recovered", {
                time: new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium", timeStyle: "short" }).format(recovered.savedAt),
              })}
              {recovered.head !== head && <> {t("recoveredStale")}</>}
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
              {t("restoreLocal")}
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                clearLocalDraft(storageKey);
                setRecovered(null);
              }}
            >
              {t("dismiss")}
            </button>
          </div>
        )}
        {head && mainChanges.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <span className="flex-1">{t("mainChanged", { files: mainChanges.join(", ") })}</span>
            <button type="button" className={button} disabled={dirty || busy !== null} onClick={mergeMain}>
              {busy === "merge" ? <Loader2 size={15} className="animate-spin" /> : <GitMerge size={15} />}
              {t("updateFromMain")}
            </button>
          </div>
        )}
        {(issues.errors.length > 0 || issues.warnings.length > 0) && (
          <details className="rounded-xl border border-border/60 p-3 text-sm" open={issues.errors.length > 0}>
            <summary className="cursor-pointer font-medium">
              {t("issues", { errors: issues.errors.length, warnings: issues.warnings.length })}
            </summary>
            <ul className="mt-2 space-y-1">
              {[...issues.errors, ...issues.warnings].map((issue, i) => (
                <li key={i} className={cn("text-xs", i < issues.errors.length ? "text-destructive" : "text-amber-700 dark:text-amber-400")}>
                  <span className="font-mono">{issue.path.split("/").pop()}</span>: {issue.message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* Shared details (meta.yml) */}
      <details open={isNewPiece} className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold">{t("details")}</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label={t("id")}>
            <input className={cn(inputClass, "font-mono text-xs")} value={doc.meta.id} readOnly />
          </Field>
          <Field label={t("originalLocale")}>
            <select
              className={inputClass}
              value={original}
              onChange={(e) => updateMeta({ originalLocale: e.target.value as Locale })}
            >
              {routing.locales
                .filter((l) => doc.translations[l])
                .map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={t("publishedAt")}>
            <input
              type="date"
              className={inputClass}
              value={doc.meta.publishedAt}
              onChange={(e) => updateMeta({ publishedAt: e.target.value })}
            />
          </Field>
          <Field label={t("tags")}>
            <input
              className={inputClass}
              value={tagsText}
              placeholder="systems, rust"
              onChange={(e) => {
                setTagsText(e.target.value);
                updateMeta({ tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) });
              }}
            />
          </Field>
          <Field label={t("cover")} className="md:col-span-2 lg:col-span-4">
            <div className="flex flex-wrap items-center gap-3">
              {doc.meta.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(doc.meta.cover)} alt="" className="h-14 w-24 rounded-md border border-border object-cover" />
              )}
              <input
                className={cn(inputClass, "min-w-0 flex-1 font-mono text-xs")}
                value={doc.meta.cover ?? ""}
                placeholder="content/<id>/<hash>.webp"
                onChange={(e) => updateMeta({ cover: e.target.value.trim() || undefined })}
              />
              <span className={cn(button, "relative cursor-pointer")}>
                <ImagePlus size={15} />
                {t("uploadCover")}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCover(file);
                    e.target.value = "";
                  }}
                />
              </span>
            </div>
          </Field>
          {kind === "series" && (
            <Field label={t("seriesItems")} className="md:col-span-2 lg:col-span-4">
              <SeriesItems items={doc.meta.items ?? []} onChange={(items) => updateMeta({ items })} pieces={pieces} />
            </Field>
          )}
        </div>
      </details>

      {/* Language tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label={t("languages")}>
        {routing.locales.map((locale) => {
          const tr = doc.translations[locale];
          if (!tr) {
            return (
              <button
                key={locale}
                type="button"
                onClick={() => addTranslation(locale)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                <Plus size={14} />
                {t("addTranslation", { locale: locale.toUpperCase() })}
              </button>
            );
          }
          return (
            <button
              key={locale}
              type="button"
              role="tab"
              aria-selected={active === locale}
              onClick={() => {
                setActive(locale);
                setOutdatedDiff(null);
                if (locale === original && panel === "original") setPanel("preview");
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active === locale ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-primary/40"
              )}
            >
              {locale.toUpperCase()}
              {locale === original && <span title={t("original")}>★</span>}
              <span
                className={cn("h-2 w-2 rounded-full", tr.status === "published" ? "bg-emerald-500" : "bg-amber-500")}
                title={t("cell", { status: tr.status })}
              />
            </button>
          );
        })}
      </div>

      {translation && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: the active translation */}
          <div className="min-w-0 space-y-4">
            {outdated && (
              <div className="rounded-xl border border-orange-500/40 bg-orange-500/5 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-orange-700 dark:text-orange-400">
                  <AlertTriangle size={15} />
                  {t("outdated")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className={button} onClick={showOutdatedDiff}>
                    {t("showOriginalChanges")}
                  </button>
                  <button
                    type="button"
                    className={button}
                    onClick={() => {
                      updateTranslation(active, { translatedFrom: originalSha! });
                      setOutdatedDiff(null);
                    }}
                  >
                    {t("markUpToDate")}
                  </button>
                </div>
                {outdatedDiff && originalFile !== undefined && (
                  <DiffView before={outdatedDiff.before} after={originalFile} className="mt-3 max-h-80 overflow-y-auto" />
                )}
              </div>
            )}
            {active !== original && !translation.translatedFrom && originalSha && (
              <p className="text-xs text-muted-foreground">
                {t("notLinked")}{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => updateTranslation(active, { translatedFrom: originalSha })}
                >
                  {t("markUpToDate")}
                </button>
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field label={t("title")}>
                <input
                  className={inputClass}
                  lang={active}
                  value={translation.title}
                  onChange={(e) => updateTranslation(active, { title: e.target.value })}
                />
              </Field>
              <Field label={t("status")}>
                <select
                  className={inputClass}
                  value={translation.status}
                  onChange={(e) => updateTranslation(active, { status: e.target.value as DocTranslation["status"] })}
                >
                  <option value="draft">{t("cell", { status: "draft" })}</option>
                  <option value="published">{t("cell", { status: "published" })}</option>
                </select>
              </Field>
            </div>
            <Field label={t("summary")}>
              <textarea
                className={cn(inputClass, "min-h-20 resize-y")}
                lang={active}
                value={translation.summary}
                onChange={(e) => updateTranslation(active, { summary: e.target.value })}
              />
            </Field>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{t("body")}</span>
                <span className="text-xs text-muted-foreground">{t("bodyHint")}</span>
              </div>
              <CodeEditor
                key={active}
                ref={editorRef}
                value={translation.body}
                onChange={(body) => updateTranslation(active, { body })}
                onImages={insertImages}
                placeholder={t("bodyPlaceholder")}
                ariaLabel={t("body")}
                className="min-h-[60vh] overflow-hidden rounded-xl border border-border/60 bg-background focus-within:border-primary/60 [&_.cm-editor]:min-h-[60vh]"
              />
            </div>

            {active !== original &&
              (confirm === `remove-${active}` ? (
                <span className="inline-flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    className={cn(button, "border-destructive text-destructive")}
                    onClick={() => removeTranslation(active)}
                  >
                    {t("confirmRemoveTranslation", { locale: active.toUpperCase() })}
                  </button>
                  <button type="button" className={button} onClick={() => setConfirm(null)}>
                    {t("cancel")}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirm(`remove-${active}`)}
                >
                  {t("removeTranslation", { locale: active.toUpperCase() })}
                </button>
              ))}
          </div>

          {/* Right: preview, original (translate mode), changes, history */}
          <div className="min-w-0">
            <div className="sticky top-40">
              <div className="mb-3 flex flex-wrap gap-1 rounded-full border border-border/60 p-1 text-sm" role="tablist">
                {(["preview", ...(active !== original ? ["original"] : []), "changes", "history"] as Panel[]).map((p) => (
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
                    {t("panel", { panel: p })}
                  </button>
                ))}
              </div>

              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto rounded-2xl border border-border/60 bg-card/40 p-5">
                {panel === "preview" && <Preview source={translation.body} lang={active} />}

                {panel === "original" && doc.translations[original] && (
                  <div className="space-y-3" lang={original}>
                    <p className="text-xs font-medium text-muted-foreground">{t("originalIn", { locale: original.toUpperCase() })}</p>
                    <p className="text-lg font-bold">{doc.translations[original]!.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.translations[original]!.summary}</p>
                    <CodeEditor
                      key={`original-${original}`}
                      value={doc.translations[original]!.body}
                      readOnly
                      ariaLabel={t("originalIn", { locale: original.toUpperCase() })}
                      className="overflow-hidden rounded-xl border border-border/60 bg-background"
                    />
                  </div>
                )}

                {panel === "changes" && (
                  <div className="space-y-5">
                    {confirm === "publish" && <p className="text-sm font-medium">{t("publishReview")}</p>}
                    <section>
                      <h3 className="mb-2 text-sm font-semibold">{t("unsavedChanges")}</h3>
                      {dirty ? (
                        Object.entries(changes).map(([name, text]) => (
                          <div key={name} className="mb-3">
                            <p className="mb-1 font-mono text-xs text-muted-foreground">{name}</p>
                            <DiffView before={baseline[name] ?? ""} after={text ?? ""} />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("noUnsaved")}</p>
                      )}
                    </section>
                    <section>
                      <h3 className="mb-2 text-sm font-semibold">{t("againstMain")}</h3>
                      {(() => {
                        const vsMain = changedFiles(
                          Object.keys(mainFiles).length ? serializeDoc(parseDoc(mainFiles, original), kind) : {},
                          current
                        );
                        const names = Object.keys(vsMain);
                        if (!names.length) return <p className="text-sm text-muted-foreground">{t("sameAsMain")}</p>;
                        return names.map((name) => (
                          <div key={name} className="mb-3">
                            <p className="mb-1 font-mono text-xs text-muted-foreground">{name}</p>
                            <DiffView
                              before={mainFiles[name] !== undefined ? serializeDoc(parseDoc(mainFiles, original), kind)[name] ?? "" : ""}
                              after={vsMain[name] ?? ""}
                            />
                          </div>
                        ));
                      })()}
                    </section>
                  </div>
                )}

                {panel === "history" &&
                  (head || !isNewPiece ? (
                    <div className="space-y-6">
                      <HistoryPanel
                        key={`${activeFile}-${head}`}
                        folder={folder}
                        slug={slug}
                        file={activeFile}
                        gitRef={head ?? "main"}
                        current={current[activeFile] ?? ""}
                        onRestore={(text) => restoreFile(activeFile, text)}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
