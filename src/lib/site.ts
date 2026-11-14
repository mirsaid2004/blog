/**
 * The public origin of the site, used for canonical URLs, the sitemap, RSS and
 * Open Graph. Set NEXT_PUBLIC_SITE_URL per environment (e.g. preview deploys).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://blog.mirsaidmirakhmedov.uz").replace(/\/$/, "");

export const SITE_NAME = "M_DEV";
export const AUTHOR = "Mirsaid Mirakhmedov";

/** Absolute URL for a path such as `/en/posts/x`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
