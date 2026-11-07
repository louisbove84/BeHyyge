import "server-only";

import {
  BlobError,
  BlobPreconditionFailedError,
  BlobServiceRateLimited,
  BlobStoreSuspendedError,
  get,
  put,
  del,
} from "@vercel/blob";
import { HttpError } from "@/lib/http";

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export function assertBlobConfigured() {
  if (!isBlobConfigured()) {
    throw new HttpError(
      503,
      "Photo storage is not configured yet. Connect a private Vercel Blob store.",
    );
  }
}

export function assertClientUploadConfigured() {
  assertBlobConfigured();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(
      503,
      "Browser uploads need the BLOB_READ_WRITE_TOKEN environment variable from the private Blob store.",
    );
  }
}

function isConflict(error: unknown) {
  if (error instanceof BlobPreconditionFailedError) return true;
  if (error instanceof BlobError) {
    return /exist|precondition|conflict|overwrite/i.test(error.message);
  }
  return false;
}

export async function withBlobErrors<T>(work: () => Promise<T>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof BlobStoreSuspendedError) {
      throw new HttpError(
        503,
        "Photo storage is paused because the included allowance was used up. It stays paused until the allowance resets. Do not turn on paid overages unless you approve that charge.",
      );
    }
    if (error instanceof BlobServiceRateLimited) {
      throw new HttpError(429, "Photo storage is busy. Wait a moment and try again.");
    }
    throw error;
  }
}

export async function readJson<T>(pathname: string): Promise<{ value: T; etag: string } | null> {
  assertBlobConfigured();
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  try {
    return { value: JSON.parse(text) as T, etag: result.blob.etag };
  } catch {
    throw new HttpError(500, "Stored information could not be read.");
  }
}

async function putJson(pathname: string, value: unknown, etag: string | null) {
  const body = JSON.stringify(value);
  if (etag) {
    await put(pathname, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      ifMatch: etag,
      contentType: "application/json",
      cacheControlMaxAge: 1,
    });
    return;
  }
  await put(pathname, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
    cacheControlMaxAge: 1,
  });
}

export async function mutateJson<T>(
  pathname: string,
  create: () => T,
  update: (current: T) => T,
) {
  assertBlobConfigured();
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existing = await readJson<T>(pathname);
    try {
      if (!existing) {
        const created = create();
        await putJson(pathname, created, null);
        return created;
      }
      const next = update(existing.value);
      if (next === existing.value) return next;
      await putJson(pathname, next, existing.etag);
      return next;
    } catch (error) {
      if (isConflict(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  console.error(lastError instanceof Error ? lastError.name : "conflict");
  throw new HttpError(409, "Another change landed at the same time. Try again.");
}

export async function removePaths(paths: string[]) {
  const unique = [...new Set(paths.filter((path) => path.length > 0))];
  for (let index = 0; index < unique.length; index += 50) {
    await del(unique.slice(index, index + 50));
  }
}
