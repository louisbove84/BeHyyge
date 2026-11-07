import { requireOwner } from "@/lib/auth";
import { deletePhoto, requireGallery } from "@/lib/galleries";
import { assertSameOrigin, HttpError, jsonError, jsonOk } from "@/lib/http";
import { isId } from "@/lib/ids";

export async function DELETE(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    assertSameOrigin(request);
    await requireOwner();
    const { id, photoId } = await context.params;
    if (!isId(id) || !isId(photoId)) throw new HttpError(404, "That photograph was not found.");
    await requireGallery(id);
    await deletePhoto(id, photoId);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
