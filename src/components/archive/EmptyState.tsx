import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function EmptyState({ resetHref }: { resetHref: string }) {
  const t = useTranslations("Archive.common");
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{t("noResultsTitle")}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("noResultsDescription")}</p>
      <Link
        href={resetHref}
        scroll={false}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t("clearFilters")}
      </Link>
    </div>
  );
}
