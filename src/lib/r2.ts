import { DeleteObjectsCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 through its S3 API (PLAN.md 2.3). Server-only: the browser gets
 * short-lived presigned URLs, never the keys.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see doc/setup-services.md)`);
  return value;
}

let client: S3Client | undefined;

function r2(): S3Client {
  return (client ??= new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: required("R2_ACCESS_KEY_ID"), secretAccessKey: required("R2_SECRET_ACCESS_KEY") },
  }));
}

export const publicBucket = () => required("R2_PUBLIC_BUCKET");

export async function objectExists(bucket: string, key: string): Promise<boolean> {
  try {
    await r2().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw error;
  }
}

/**
 * A URL the browser can PUT the file to for the next 5 minutes. The browser must
 * send the same Content-Type, since it is signed. Only Content-Type is signed
 * because the bucket's CORS policy allows just that header (doc/setup-services.md).
 * Keys are content hashes and never change, so long caching belongs on the
 * public domain (a Cloudflare cache rule) rather than on each object.
 */
export function presignPut(bucket: string, key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2(), command, { expiresIn: 300, signableHeaders: new Set(["content-type"]) });
}

/** Delete keys, 1,000 per request (the S3 limit). Missing keys are not an error. */
export async function deleteObjects(bucket: string, keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    const { Errors } = await r2().send(
      new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true } })
    );
    if (Errors?.length) throw new Error(`R2 delete failed for ${Errors.map((e) => e.Key).join(", ")}`);
  }
}
