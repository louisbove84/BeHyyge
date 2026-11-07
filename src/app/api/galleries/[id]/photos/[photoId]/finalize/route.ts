import { get, put } from "@vercel/blob";
import { requireOwner } from "@/lib/auth";
import { getPhoto, requireGallery, toPhotoDto, updatePhoto } from "@/lib/galleries";
import { MAX_IMAGE_BYTES } from "@/lib/files";
import { assertSameOrigin, HttpError, jsonError, jsonOk } from "@/lib/http";
import { makeDisplayWebp } from "@/lib/images";
import { isId } from "@/lib/ids";
import { displayPath, isOwnedBlobPath } from "@/lib/paths";
import { assertBlobConfigured } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    assertSameOrigin(request);
    await requireOwner();
    assertBlobConfigured();
    const { id, photoId } = await context.params;
    if (!isId(id) || !isId(photoId)) throw new HttpError(404, "That photograph was not found.");
    const gallery = await requireGallery(id);
    const photo = await getPhoto(id, photoId);
    if (!photo) throw new HttpError(404, "That photograph was not found.");
    if (photo.status === "ready" && photo.displayPath) return jsonOk({ photo: toPhotoDto(photo) });
    if (!isOwnedBlobPath(photo.originalPath, gallery.id, "originals")) {
      throw new HttpError(404, "That photograph was not found.");
    }

    const stored = await get(photo.originalPath, { access: "private", useCache: false });
    if (!stored || stored.statusCode !== 200 || !stored.stream) {
      throw new HttpError(400, "The file has not arrived yet. Try the upload again.");
    }
    const bytes = Buffer.from(await new Response(stored.stream).arrayBuffer());
    if (bytes.length < 1 || bytes.length > MAX_IMAGE_BYTES) {
      throw new HttpError(413, "Each photograph must be 25 MB or smaller.");
    }

    try {
      const display = await makeDisplayWebp(bytes);
      const previewPath = displayPath(gallery.id, photo.id);
      await put(previewPath, display.bytes, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/webp",
        cacheControlMaxAge: 60 * 60 * 24 * 30,
      });
      const updated = await updatePhoto(gallery.id, photo.id, (current) => ({
        ...current,
        status: "ready",
        error: null,
        width: display.sourceWidth,
        height: display.sourceHeight,
        displayPath: previewPath,
        bytes: bytes.length,
      }));
      return jsonOk({ photo: toPhotoDto(updated) });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      await updatePhoto(gallery.id, photo.id, (current) => ({
        ...current,
        status: "failed",
        error: "A private preview could not be prepared. Retry, or export the photograph as a JPEG.",
      }));
      throw new HttpError(
        422,
        "A private preview could not be prepared. Retry, or export the photograph as a JPEG.",
      );
    }
  } catch (error) {
    return jsonError(error);
  }
}
