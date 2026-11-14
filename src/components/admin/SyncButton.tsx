"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { syncNow, type SyncState } from "@/app/[locale]/admin/actions";
import { cn } from "@/lib/utils";

export function SyncButton() {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState<SyncState>(syncNow, { status: "idle" });

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-60"
      >
        <RefreshCw size={16} className={cn(pending && "animate-spin")} />
        {pending ? t("syncing") : t("syncNow")}
      </button>
      {state.status === "ok" && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("synced", { items: state.items, downloaded: state.downloaded, removed: state.removed })}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t("syncFailed", { message: state.message })}
        </p>
      )}
    </form>
  );
}
