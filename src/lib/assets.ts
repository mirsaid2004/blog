/**
 * Images in content are stored in the public R2 bucket and referenced by key
 * (`content/<id>/<hash>.webp`, see PLAN.md 2.3), so the bucket's domain can
 * change without editing content. Absolute URLs and site paths pass through.
 */
const ASSETS_URL = (process.env.NEXT_PUBLIC_ASSETS_URL ?? "").replace(/\/$/, "");

export function assetUrl(src: string): string;
export function assetUrl(src: string | undefined): string | undefined;
export function assetUrl(src: string | undefined): string | undefined {
  if (!src || /^(https?:)?\/\//.test(src) || src.startsWith("/") || src.startsWith("data:")) return src;
  if (!ASSETS_URL) throw new Error(`NEXT_PUBLIC_ASSETS_URL is not set, can't resolve image "${src}"`);
  return `${ASSETS_URL}/${src.replace(/^\//, "")}`;
}
