"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { renderPreview } from "@/lib/editor/actions";

const DELAY = 600;

/**
 * Live preview, rendered on the server with the same MDX compiler and
 * components as the site. While the source has an error, the last good render
 * stays visible under the error message.
 */
export default function Preview({ source, lang }: { source: string; lang: string }) {
  const t = useTranslations("Editor");
  const [node, setNode] = useState<ReactNode>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPending(true);
      const result = await renderPreview(source);
      if (cancelled) return;
      setPending(false);
      if (result.ok) {
        setNode(result.node);
        setError(null);
      } else {
        setError(result.error);
      }
    }, DELAY);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source]);

  return (
    <div className="relative">
      {pending && (
        <span className="absolute right-0 top-0 text-xs text-muted-foreground" role="status">
          {t("rendering")}
        </span>
      )}
      {error && (
        <pre className="mb-4 whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </pre>
      )}
      {source.trim() ? (
        <div className="article-body" lang={lang}>
          {node}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("previewEmpty")}</p>
      )}
    </div>
  );
}
