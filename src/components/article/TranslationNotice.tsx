import type { Locale } from "next-intl";
import { useLocale, useTranslations } from "next-intl";
import { Info, Languages } from "lucide-react";
import { Link } from "@/i18n/routing";
import { nativeLanguageName } from "@/lib/content/languages";
import type { Localized } from "@/lib/content/types";
import { cn } from "@/lib/utils";

interface TranslationProps {
  kind: "article" | "post" | "series";
  localized: Localized;
  /** This page's path without the locale prefix (query included), e.g. `/posts/x?series=y`. */
  href: string;
  className?: string;
}

function LanguageLink({ href, code, current }: { href: string; code: Locale; current?: boolean }) {
  return (
    <Link
      href={href}
      locale={code}
      hrefLang={code}
      lang={code}
      aria-current={current ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        current
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background/60 text-foreground hover:border-primary/40 hover:text-primary"
      )}
    >
      {nativeLanguageName(code)}
    </Link>
  );
}

/**
 * Shown when the piece isn't published in the reader's language: says which
 * version they're reading, promises the translation only when a draft exists,
 * and links to every published language.
 */
export function TranslationNotice({ kind, localized, href, className }: TranslationProps) {
  const locale = useLocale();
  const t = useTranslations("Translation");
  if (localized.locale === locale) return null;

  return (
    <div
      role="note"
      className={cn(
        "rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground",
        className
      )}
    >
      <p className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          {t("fallback", { type: kind, requested: locale, shown: localized.locale })}
          {localized.upcoming.includes(locale) && (
            <>
              {" "}
              <strong className="font-semibold text-foreground">
                {t("comingSoon", { requested: locale })}
              </strong>
            </>
          )}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
        <span>{t("readIn")}</span>
        {localized.languages.map((code) => (
          <LanguageLink key={code} href={href} code={code} current={code === localized.locale} />
        ))}
      </div>
    </div>
  );
}

/** The other published languages of a piece the reader is reading in their own language. */
export function OtherLanguages({ localized, href, className }: Omit<TranslationProps, "kind">) {
  const locale = useLocale();
  const t = useTranslations("Translation");
  const others = localized.languages.filter((code) => code !== localized.locale);
  if (localized.locale !== locale || others.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm text-muted-foreground", className)}>
      <Languages className="h-4 w-4" aria-hidden />
      <span>{t("alsoIn")}</span>
      {others.map((code) => (
        <LanguageLink key={code} href={href} code={code} />
      ))}
    </div>
  );
}
