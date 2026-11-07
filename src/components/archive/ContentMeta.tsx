import { useLocale, useTranslations } from "next-intl";
import { Clock, Eye, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompact, formatDate, formatRating } from "@/lib/content/format";

interface ContentMetaProps {
  publishedAt?: string;
  readMinutes?: number;
  views: number;
  rating: number;
  ratingCount: number;
  className?: string;
}

/** Date · read time · views · rating, separated by dots. */
export default function ContentMeta({
  publishedAt,
  readMinutes,
  views,
  rating,
  ratingCount,
  className,
}: ContentMetaProps) {
  const t = useTranslations("Archive.common");
  const locale = useLocale();
  const ratingText = formatRating(rating, locale);

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {publishedAt && (
        <li>
          <time dateTime={publishedAt}>{formatDate(publishedAt, locale)}</time>
        </li>
      )}
      {readMinutes !== undefined && (
        <li className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {t("minRead", { minutes: readMinutes })}
        </li>
      )}
      <li className="flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" aria-hidden />
        <span>
          <span aria-hidden>{formatCompact(views, locale)}</span>
          <span className="sr-only">{t("views", { count: formatCompact(views, locale) })}</span>
        </span>
      </li>
      <li className="flex items-center gap-1" title={t("ratings", { rating: ratingText, count: ratingCount })}>
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
        <span className="text-foreground/80">{ratingText}</span>
        <span className="sr-only">{t("ratings", { rating: ratingText, count: ratingCount })}</span>
        <span aria-hidden>({formatCompact(ratingCount, locale)})</span>
      </li>
    </ul>
  );
}
