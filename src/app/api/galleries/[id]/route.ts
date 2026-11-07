import { requireOwner } from "@/lib/auth";
import { deleteGallery, regenerateShare, requireGallery, updateGallery } from "@/lib/galleries";
import {
  assertSameOrigin,
  booleanField,
  jsonError,
  jsonOk,
  readJsonBody,
  stringField,
} from "@/lib/http";
import { isId } from "@/lib/ids";
import { HttpError } from "@/lib/http";

async function ownerGallery(id: string) {
  await requireOwner();
  if (!isId(id)) throw new HttpError(404, "That gallery was not found.");
  return requireGallery(id);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await context.params;
    await ownerGallery(id);
    const body = await readJsonBody(request);
    if (body.regenerateShare === true) {
      const gallery = await regenerateShare(id);
      return jsonOk({ shareToken: gallery.shareToken });
    }
    const gallery = await updateGallery(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      kind: typeof body.kind === "string" ? body.kind : undefined,
      note: typeof body.note === "string" ? body.note : undefined,
      password: stringField(body, "password") || undefined,
      clearPassword: booleanField(body, "clearPassword"),
    });
    return jsonOk({
      gallery: {
        id: gallery.id,
        name: gallery.name,
        hasPassword: Boolean(gallery.passwordHash),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await context.params;
    await ownerGallery(id);
    await deleteGallery(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
