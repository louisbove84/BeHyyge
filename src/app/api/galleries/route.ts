import { requireOwner } from "@/lib/auth";
import { createGallery } from "@/lib/galleries";
import { assertSameOrigin, jsonError, jsonOk, readJsonBody, stringField } from "@/lib/http";
import { assertBlobConfigured } from "@/lib/store";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireOwner();
    assertBlobConfigured();
    const body = await readJsonBody(request);
    const gallery = await createGallery({
      name: stringField(body, "name"),
      kind: stringField(body, "kind") || "family",
      note: stringField(body, "note"),
      password: stringField(body, "password"),
    });
    return jsonOk({
      gallery: {
        id: gallery.id,
        name: gallery.name,
        shareToken: gallery.shareToken,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
