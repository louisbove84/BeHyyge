import { mediaError, serveGalleryPhoto } from "@/lib/media";

export async function GET(_request: Request, context: { params: Promise<{ token: string; photoId: string }> }) {
  try {
    const { token, photoId } = await context.params;
    return await serveGalleryPhoto(token, photoId, "display");
  } catch (error) {
    return mediaError(error);
  }
}
