import "server-only";

import { list } from "@vercel/blob";
import { canViewGallery, type UnlockClaims } from "@/lib/access";
import { assertSessionSecret, sessionSecret } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { isGalleryKind, type GalleryKind } from "@/lib/kinds";
import { hashPassword, validateGalleryPassword } from "@/lib/password";
import { galleryPath, indexPath, photosPath, sharePath } from "@/lib/paths";
import { createId, createShareToken, isId, isShareToken } from "@/lib/ids";
import { mutateJson, readJson, removePaths, withBlobErrors } from "@/lib/store";
import { signToken, verifyToken } from "@/lib/tokens";
import { cookies } from "next/headers";
import type { PhotoDto } from "@/lib/photo-view";

export type { PhotoDto };

export type GalleryRecord = {
  id: string;
  name: string;
  kind: GalleryKind;
  note: string;
  shareToken: string;
  passwordHash: string | null;
  passwordVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type GallerySummary = {
  id: string;
  name: string;
  kind: GalleryKind;
  createdAt: string;
  updatedAt: string;
  shareToken: string;
  hasPassword: boolean;
  photoCount: number;
};

export type PhotoRecord = {
  id: string;
  galleryId: string;
  originalName: string;
  contentType: string;
  ext: string;
  bytes: number;
  width: number | null;
  height: number | null;
  originalPath: string;
  displayPath: string | null;
  createdAt: string;
  status: "pending" | "ready" | "failed";
  error: string | null;
};

type IndexFile = { galleries: GallerySummary[] };
type PhotoFile = { photos: PhotoRecord[] };

const MAX_PHOTOS = 400;
const UNLOCK_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function timestamp() {
  return new Date().toISOString();
}

function cleanName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  if (cleaned.length < 1 || cleaned.length > 80) {
    throw new HttpError(400, "Give the gallery a name up to 80 characters.");
  }
  if (/[\u0000-\u001F]/.test(cleaned)) {
    throw new HttpError(400, "The gallery name has characters that cannot be used.");
  }
  return cleaned;
}

function cleanNote(note: string) {
  const cleaned = note.replace(/\r\n/g, "\n").trim();
  if (cleaned.length > 500) {
    throw new HttpError(400, "Keep the note to 500 characters.");
  }
  return cleaned;
}

function summaryFrom(gallery: GalleryRecord, photoCount: number): GallerySummary {
  return {
    id: gallery.id,
    name: gallery.name,
    kind: gallery.kind,
    createdAt: gallery.createdAt,
    updatedAt: gallery.updatedAt,
    shareToken: gallery.shareToken,
    hasPassword: Boolean(gallery.passwordHash),
    photoCount,
  };
}

export function toPhotoDto(photo: PhotoRecord): PhotoDto {
  return {
    id: photo.id,
    originalName: photo.originalName,
    width: photo.width,
    height: photo.height,
    bytes: photo.bytes,
    status: photo.status,
    error: photo.error,
    createdAt: photo.createdAt,
  };
}

async function syncSummary(gallery: GalleryRecord, photoCount: number) {
  const summary = summaryFrom(gallery, photoCount);
  await mutateJson<IndexFile>(
    indexPath(),
    () => ({ galleries: [summary] }),
    (index) => ({
      galleries: index.galleries.some((item) => item.id === gallery.id)
        ? index.galleries.map((item) => (item.id === gallery.id ? summary : item))
        : [summary, ...index.galleries],
    }),
  );
}

export async function listGalleries() {
  const index = await readJson<IndexFile>(indexPath());
  return index?.value.galleries ?? [];
}

export async function getGallery(id: string) {
  if (!isId(id)) return null;
  const record = await readJson<GalleryRecord>(galleryPath(id));
  return record?.value ?? null;
}

export async function requireGallery(id: string) {
  const gallery = await getGallery(id);
  if (!gallery) throw new HttpError(404, "That gallery was not found.");
  return gallery;
}

export async function getGalleryByShareToken(token: string) {
  if (!isShareToken(token)) return null;
  const pointer = await readJson<{ galleryId: string }>(sharePath(token));
  if (!pointer || !isId(pointer.value.galleryId)) return null;
  const gallery = await getGallery(pointer.value.galleryId);
  if (!gallery || gallery.shareToken !== token) return null;
  return gallery;
}

export async function listPhotos(galleryId: string) {
  if (!isId(galleryId)) return [];
  const file = await readJson<PhotoFile>(photosPath(galleryId));
  return file?.value.photos ?? [];
}

export async function getPhoto(galleryId: string, photoId: string) {
  const photos = await listPhotos(galleryId);
  return photos.find((photo) => photo.id === photoId) ?? null;
}

export async function createGallery(input: {
  name: string;
  kind: string;
  note: string;
  password: string;
}) {
  const name = cleanName(input.name);
  if (!isGalleryKind(input.kind)) throw new HttpError(400, "Choose a session type.");
  const note = cleanNote(input.note);
  let passwordHash: string | null = null;
  if (input.password) {
    const passwordError = validateGalleryPassword(input.password);
    if (passwordError) throw new HttpError(400, passwordError);
    passwordHash = await hashPassword(input.password);
  }
  const id = createId();
  const shareToken = createShareToken();
  const createdAt = timestamp();
  const gallery: GalleryRecord = {
    id,
    name,
    kind: input.kind,
    note,
    shareToken,
    passwordHash,
    passwordVersion: 1,
    createdAt,
    updatedAt: createdAt,
  };

  await withBlobErrors(async () => {
    await mutateJson<GalleryRecord>(
      galleryPath(id),
      () => gallery,
      () => gallery,
    );
    await mutateJson<{ galleryId: string }>(
      sharePath(shareToken),
      () => ({ galleryId: id }),
      (current) => current,
    );
    await mutateJson<PhotoFile>(
      photosPath(id),
      () => ({ photos: [] }),
      (current) => current,
    );
    await syncSummary(gallery, 0);
  });
  return gallery;
}

export async function updateGallery(
  id: string,
  patch: {
    name?: string;
    kind?: string;
    note?: string;
    password?: string;
    clearPassword?: boolean;
  },
) {
  if (patch.clearPassword && patch.password) {
    throw new HttpError(400, "Remove the password or set a new one, not both.");
  }
  const existing = await requireGallery(id);
  const name = patch.name === undefined ? existing.name : cleanName(patch.name);
  const kind = patch.kind === undefined ? existing.kind : patch.kind;
  if (!isGalleryKind(kind)) throw new HttpError(400, "Choose a session type.");
  const note = patch.note === undefined ? existing.note : cleanNote(patch.note);
  let nextHash = existing.passwordHash;
  let rotate = false;
  if (patch.clearPassword) {
    nextHash = null;
    rotate = true;
  } else if (patch.password) {
    const passwordError = validateGalleryPassword(patch.password);
    if (passwordError) throw new HttpError(400, passwordError);
    nextHash = await hashPassword(patch.password);
    rotate = true;
  }

  const updated = await withBlobErrors(() =>
    mutateJson<GalleryRecord>(
      galleryPath(id),
      () => {
        throw new HttpError(404, "That gallery was not found.");
      },
      (current) => ({
        ...current,
        name,
        kind,
        note,
        passwordHash: nextHash,
        passwordVersion: rotate ? current.passwordVersion + 1 : current.passwordVersion,
        updatedAt: timestamp(),
      }),
    ),
  );
  const photos = await listPhotos(id);
  await syncSummary(updated, photos.length);
  return updated;
}

async function blobPathsUnder(prefix: string) {
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const blob of page.blobs) paths.push(blob.pathname);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return paths;
}

export async function deleteGallery(id: string) {
  const gallery = await requireGallery(id);
  const photos = await listPhotos(id);
  const known = [
    photosPath(id),
    sharePath(gallery.shareToken),
    ...photos.flatMap((photo) => [photo.originalPath, photo.displayPath ?? ""]),
  ];
  const stored = [
    ...(await blobPathsUnder(`studio/originals/${id}/`)),
    ...(await blobPathsUnder(`studio/display/${id}/`)),
  ];
  await withBlobErrors(() => removePaths([...known, ...stored]));
  await mutateJson<IndexFile>(
    indexPath(),
    () => ({ galleries: [] }),
    (index) => ({ galleries: index.galleries.filter((item) => item.id !== id) }),
  );
  await removePaths([galleryPath(id)]);
}

export async function regenerateShare(id: string) {
  const gallery = await requireGallery(id);
  const nextToken = createShareToken();
  await withBlobErrors(async () => {
    await mutateJson<{ galleryId: string }>(
      sharePath(nextToken),
      () => ({ galleryId: id }),
      (current) => current,
    );
    const updated = await mutateJson<GalleryRecord>(
      galleryPath(id),
      () => {
        throw new HttpError(404, "That gallery was not found.");
      },
      (current) => ({ ...current, shareToken: nextToken, updatedAt: timestamp() }),
    );
    await removePaths([sharePath(gallery.shareToken)]);
    const photos = await listPhotos(id);
    await syncSummary(updated, photos.length);
    return updated;
  });
  return requireGallery(id);
}

export async function addPendingPhoto(gallery: GalleryRecord, photo: PhotoRecord) {
  const file = await withBlobErrors(() =>
    mutateJson<PhotoFile>(
      photosPath(gallery.id),
      () => ({ photos: [photo] }),
      (current) => {
        if (current.photos.some((item) => item.id === photo.id)) return current;
        if (current.photos.length >= MAX_PHOTOS) {
          throw new HttpError(400, "This gallery already holds 400 photographs. Start another one.");
        }
        return { photos: [...current.photos, photo] };
      },
    ),
  );
  await syncSummary(gallery, file.photos.length);
  return photo;
}

export async function updatePhoto(
  galleryId: string,
  photoId: string,
  updater: (photo: PhotoRecord) => PhotoRecord,
) {
  let updated: PhotoRecord | null = null;
  const file = await withBlobErrors(() =>
    mutateJson<PhotoFile>(
      photosPath(galleryId),
      () => {
        throw new HttpError(404, "That photograph was not found.");
      },
      (current) => {
        let found = false;
        const photos = current.photos.map((photo) => {
          if (photo.id !== photoId) return photo;
          found = true;
          updated = updater(photo);
          return updated;
        });
        if (!found) throw new HttpError(404, "That photograph was not found.");
        return { photos };
      },
    ),
  );
  const gallery = await requireGallery(galleryId);
  await syncSummary(gallery, file.photos.length);
  if (!updated) throw new HttpError(404, "That photograph was not found.");
  return updated;
}

export async function deletePhoto(galleryId: string, photoId: string) {
  const gallery = await requireGallery(galleryId);
  const photo = await getPhoto(galleryId, photoId);
  if (!photo) throw new HttpError(404, "That photograph was not found.");
  const file = await withBlobErrors(() =>
    mutateJson<PhotoFile>(
      photosPath(galleryId),
      () => ({ photos: [] }),
      (current) => ({ photos: current.photos.filter((item) => item.id !== photoId) }),
    ),
  );
  await removePaths([photo.originalPath, photo.displayPath ?? ""]);
  await syncSummary(gallery, file.photos.length);
}

export function unlockCookieName(galleryId: string) {
  return `studio_g_${galleryId}`;
}

export function unlockCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: UNLOCK_MAX_AGE_SECONDS,
  };
}

export function createUnlockToken(galleryId: string, passwordVersion: number) {
  return signToken(
    {
      galleryId,
      passwordVersion,
      exp: Date.now() + UNLOCK_MAX_AGE_SECONDS * 1000,
    },
    assertSessionSecret(),
  );
}

export async function galleryIsOpen(gallery: GalleryRecord) {
  if (!gallery.passwordHash) return true;
  const secret = sessionSecret();
  if (!secret) return false;
  const jar = await cookies();
  const raw = jar.get(unlockCookieName(gallery.id))?.value;
  const claims = raw ? verifyToken<UnlockClaims>(raw, secret) : null;
  return canViewGallery({
    galleryId: gallery.id,
    hasPassword: true,
    passwordVersion: gallery.passwordVersion,
    claims,
    now: Date.now(),
  });
}
