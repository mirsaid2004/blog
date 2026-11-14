import type { Locale } from "next-intl";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { languageList } from "@/lib/content/languages";
import { cn } from "@/lib/utils";

interface LanguageBadgeProps {
  /** Languages the piece is published in. */
  languages: Locale[];
  className?: string;
}

/**
 * "EN · RU" on a card whose piece isn't published in the reader's language.
 * Renders nothing when it is, so most cards stay clean.
 */
export default function LanguageBadge({ languages, className }: LanguageBadgeProps) {
  const locale = useLocale();
  const t = useTranslations("Translation");
  if (languages.includes(locale)) return null;

  const label = t("availableIn", { languages: languageList(languages, locale) });
  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
        className
      )}
    >
      <Languages className="h-3 w-3" aria-hidden />
      <span aria-hidden>{languages.join(" · ")}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
