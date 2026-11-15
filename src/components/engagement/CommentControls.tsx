"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { SignInButtons } from "@/components/auth/UserMenu";
import { hideComment, postComment, removeComment, type CommentResult } from "@/lib/engagement/actions";

const MAX = 2000;

type ErrorKey = Extract<CommentResult, { ok: false }>["error"];

export function CommentForm({ contentId, locale, signedIn }: { contentId: string; locale: string; signedIn: boolean }) {
  const t = useTranslations("Comments");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <p className="mb-3 text-sm text-muted-foreground">{t("signInToComment")}</p>
        <SignInButtons className="max-w-xs" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) return;
        startTransition(async () => {
          const result = await postComment(contentId, locale, body);
          if (!result.ok) return setError(result.error);
          setBody("");
          setError(null);
          router.refresh();
        });
      }}
      className="space-y-2"
    >
      <label htmlFor="comment-body" className="sr-only">
        {t("label")}
      </label>
      <textarea
        id="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX}
        rows={3}
        placeholder={t("placeholder")}
        className="w-full resize-y rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {error ? <span role="alert" className="text-destructive">{t("error", { error })}</span> : t("hint")}
        </span>
        <span className="flex items-center gap-3">
          {body.length > MAX * 0.8 && <span className="text-xs text-muted-foreground">{MAX - body.length}</span>}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {t("post")}
          </button>
        </span>
      </div>
    </form>
  );
}

export function CommentActions({
  id,
  canDelete,
  canHide,
  hidden,
}: {
  id: string;
  canDelete: boolean;
  canHide: boolean;
  hidden: boolean;
}) {
  const t = useTranslations("Comments");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  if (!canDelete && !canHide) return null;

  const run = (action: () => Promise<CommentResult>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
    });

  const link = "text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50";
  return (
    <div className="mt-1 flex items-center gap-3">
      {canHide && (
        <button type="button" className={link} disabled={pending} onClick={() => run(() => hideComment(id, !hidden))}>
          {hidden ? t("unhide") : t("hide")}
        </button>
      )}
      {canDelete &&
        (confirming ? (
          <>
            <button
              type="button"
              className="text-xs font-medium text-destructive disabled:opacity-50"
              disabled={pending}
              onClick={() => run(() => removeComment(id))}
            >
              {t("confirmDelete")}
            </button>
            <button type="button" className={link} onClick={() => setConfirming(false)}>
              {t("cancel")}
            </button>
          </>
        ) : (
          <button type="button" className={link} onClick={() => setConfirming(true)}>
            {t("delete")}
          </button>
        ))}
    </div>
  );
}
