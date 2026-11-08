/** Locale-aware formatting helpers for content metadata. */

export function formatDate(iso: string, locale: string, style: "medium" | "long" = "medium") {
  return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );
}

export function formatMonth(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatCompact(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRating(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
