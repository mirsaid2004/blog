import type { ImageType, UploadTicket } from "@/lib/editor/assets";

/**
 * Paste/drop upload (PLAN.md 2.3): resize in the browser, convert to WebP,
 * name the file by its content hash, then PUT it straight to R2 with a
 * presigned URL. The server records the asset before handing out the URL.
 */

const MAX_WIDTH = 1600;
const QUALITY = 0.85;

export interface UploadedImage {
  key: string;
  width: number;
  height: number;
}

type Encoded = { blob: Blob; type: "image/webp" | "image/jpeg" | "image/gif"; width: number; height: number };

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

async function encode(file: File): Promise<Encoded> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  // GIFs may be animated; re-encoding would keep only the first frame.
  if (file.type === "image/gif") {
    bitmap.close();
    return { blob: file, type: "image/gif", width, height };
  }
  const scale = Math.min(1, MAX_WIDTH / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Browsers that can't encode WebP return PNG instead; fall back to JPEG then.
  const webp = await toBlob(canvas, "image/webp");
  if (webp?.type === "image/webp") return { blob: webp, type: "image/webp", width: canvas.width, height: canvas.height };
  const jpeg = await toBlob(canvas, "image/jpeg");
  if (!jpeg) throw new Error("Couldn't encode the image");
  return { blob: jpeg, type: "image/jpeg", width: canvas.width, height: canvas.height };
}

async function hash16(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Asks the server to record the image and hand out an upload URL (public or private bucket). */
export type RequestTicket = (image: {
  hash: string;
  contentType: ImageType;
  bytes: number;
}) => Promise<({ ok: true } & UploadTicket) | { ok: false; error: string }>;

export async function uploadImage(file: File, request: RequestTicket) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") throw new Error(`Unsupported file: ${file.name}`);
  const { blob, type, width, height } = await encode(file);
  const ticket = await request({ hash: await hash16(blob), contentType: type, bytes: blob.size });
  if (!ticket.ok) throw new Error(ticket.error);
  if (ticket.url) {
    const response = await fetch(ticket.url, {
      method: "PUT",
      body: blob,
      headers: { "content-type": type },
    });
    if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  }
  return { key: ticket.key, width, height } satisfies UploadedImage;
}

/** The MDX inserted for an uploaded image. */
export function imgTag({ key, width, height }: UploadedImage, alt = "") {
  return `<Img src="${key}" width={${width}} height={${height}} alt="${alt.replace(/"/g, "&quot;")}" />`;
}
