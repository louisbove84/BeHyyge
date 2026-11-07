import "server-only";

import { get } from "@vercel/blob";
import { HttpError, PRIVATE_HEADERS } from "@/lib/http";
import { galleryIsOpen, getGalleryByShareToken, getPhoto } from "@/lib/galleries";
import { isOwnedBlobPath } from "@/lib/paths";
import { isId, isShareToken } from "@/lib/ids";
import { attachmentDisposition } from "@/lib/files";

function plain(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function serveGalleryPhoto(
  token: string,
  photoId: string,
  variant: "display" | "original",
) {
  if (!isShareToken(token) || !isId(photoId)) return plain(404, "Not found");
  const gallery = await getGalleryByShareToken(token);
  if (!gallery) return plain(404, "Not found");
  const open = await galleryIsOpen(gallery);
  if (!open) {
    return plain(401, "This gallery needs its password before photographs can be opened.");
  }
  const photo = await getPhoto(gallery.id, photoId);
  if (!photo || photo.galleryId !== gallery.id || photo.status !== "ready") {
    return plain(404, "Not found");
  }

  const pathname = variant === "display" ? photo.displayPath : photo.originalPath;
  const kind = variant === "display" ? "display" : "originals";
  if (!pathname || !isOwnedBlobPath(pathname, gallery.id, kind)) return plain(404, "Not found");

  const result = await get(pathname, {
    access: "private",
    useCache: variant === "display",
  });
  if (!result || result.statusCode !== 200 || !result.stream) return plain(404, "Not found");

  const filename = variant === "display" ? `${photo.originalName}.webp` : photo.originalName;
  const type = variant === "display" ? "image/webp" : photo.contentType;
  return new Response(result.stream, {
    status: 200,
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": type,
      "Content-Disposition":
        variant === "original" ? attachmentDisposition(filename) : "inline",
    },
  });
}

export function mediaError(error: unknown) {
  if (error instanceof HttpError) return plain(error.status, error.message);
  console.error(error instanceof Error ? error.name : "media");
  return plain(500, "The photograph could not be opened.");
}
