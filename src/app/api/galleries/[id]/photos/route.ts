import { requireOwner } from "@/lib/auth";
import { addPendingPhoto, requireGallery, type PhotoRecord } from "@/lib/galleries";
import { validateImageUpload } from "@/lib/files";
import { assertSameOrigin, HttpError, jsonError, jsonOk, readJsonBody, stringField } from "@/lib/http";
import { createId, isId } from "@/lib/ids";
import { originalPath } from "@/lib/paths";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertBlobConfigured } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    await requireOwner();
    assertBlobConfigured();
    await enforceRateLimit(request, "upload");
    const { id } = await context.params;
    if (!isId(id)) throw new HttpError(404, "That gallery was not found.");
    const gallery = await requireGallery(id);
    const body = await readJsonBody(request);
    const size = body.size;
    if (typeof size !== "number" || !Number.isInteger(size)) {
      throw new HttpError(400, "The file size is missing.");
    }
    const checked = validateImageUpload({
      name: stringField(body, "name"),
      type: stringField(body, "type"),
      size,
    });
    if (!checked.ok) throw new HttpError(400, checked.error);
    const photoId = createId();
    const photo: PhotoRecord = {
      id: photoId,
      galleryId: gallery.id,
      originalName: checked.originalName,
      contentType: checked.contentType,
      ext: checked.ext,
      bytes: size,
      width: null,
      height: null,
      originalPath: originalPath(gallery.id, photoId, checked.ext),
      displayPath: null,
      createdAt: new Date().toISOString(),
      status: "pending",
      error: null,
    };
    await addPendingPhoto(gallery, photo);
    return jsonOk({ photoId, pathname: photo.originalPath, contentType: photo.contentType });
  } catch (error) {
    return jsonError(error);
  }
}
