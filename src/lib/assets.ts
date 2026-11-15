/**
 * Images in content are stored in the public R2 bucket and referenced by key
 * (`content/<id>/<hash>.webp`, see PLAN.md 2.3), so the bucket's domain can
 * change without editing content. Absolute URLs and site paths pass through.
 *
 * Note images (`notes/<id>/<hash>.webp`) live in the private bucket and are
 * served through an admin-only route that redirects to a short-lived URL.
 */
const ASSETS_URL = (process.env.NEXT_PUBLIC_ASSETS_URL ?? "").replace(/\/$/, "");

export function assetUrl(src: string): string;
export function assetUrl(src: string | undefined): string | undefined;
export function assetUrl(src: string | undefined): string | undefined {
  if (!src || /^(https?:)?\/\//.test(src) || src.startsWith("/") || src.startsWith("data:")) return src;
  if (isPrivateAsset(src)) return `/api/notes/assets/${src}`;
  if (!ASSETS_URL) throw new Error(`NEXT_PUBLIC_ASSETS_URL is not set, can't resolve image "${src}"`);
  return `${ASSETS_URL}/${src.replace(/^\//, "")}`;
}

/** Whether a key is a note image in the private bucket. */
export function isPrivateAsset(src: string): boolean {
  return src.startsWith("notes/");
}
