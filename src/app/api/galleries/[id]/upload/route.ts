import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireOwner } from "@/lib/auth";
import { getPhoto, requireGallery } from "@/lib/galleries";
import { ALLOWED_CONTENT_TYPES, MAX_IMAGE_BYTES } from "@/lib/files";
import { assertSameOrigin, HttpError, jsonError } from "@/lib/http";
import { isId } from "@/lib/ids";
import { assertClientUploadConfigured } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const { id } = await context.params;
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        assertSameOrigin(request);
        await requireOwner();
        assertClientUploadConfigured();
        if (!isId(id)) throw new HttpError(404, "That gallery was not found.");
        await requireGallery(id);
        let photoId = "";
        try {
          const parsed = clientPayload ? (JSON.parse(clientPayload) as { photoId?: unknown }) : {};
          photoId = typeof parsed.photoId === "string" ? parsed.photoId : "";
        } catch {
          throw new HttpError(400, "The upload could not be matched to a photograph.");
        }
        if (!isId(photoId)) throw new HttpError(400, "The upload could not be matched to a photograph.");
        const photo = await getPhoto(id, photoId);
        if (!photo || (photo.status !== "pending" && photo.status !== "failed")) {
          throw new HttpError(400, "That photograph is not waiting for a file.");
        }
        if (pathname !== photo.originalPath) {
          throw new HttpError(400, "That upload path is not allowed.");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
          tokenPayload: JSON.stringify({ galleryId: id, photoId }),
        };
      },
      onUploadCompleted: async () => {
        // The browser calls finalize so preview preparation stays on a request the owner can retry.
      },
    });
    return Response.json(json);
  } catch (error) {
    return jsonError(error);
  }
}
