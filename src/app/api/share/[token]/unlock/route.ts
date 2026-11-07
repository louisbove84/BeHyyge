import { cookies } from "next/headers";
import { getGalleryByShareToken, createUnlockToken, unlockCookieName, unlockCookieOptions } from "@/lib/galleries";
import { assertSameOrigin, HttpError, jsonError, jsonOk, readJsonBody, stringField } from "@/lib/http";
import { isShareToken } from "@/lib/ids";
import { verifyPassword } from "@/lib/password";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    if (!isShareToken(token)) throw new HttpError(404, "This link does not open a gallery.");
    await enforceRateLimit(request, "unlock", token);
    const gallery = await getGalleryByShareToken(token);
    if (!gallery) throw new HttpError(404, "This link does not open a gallery.");
    if (!gallery.passwordHash) {
      throw new HttpError(400, "This gallery does not use a password.");
    }
    const body = await readJsonBody(request);
    const password = stringField(body, "password");
    const matches = await verifyPassword(password, gallery.passwordHash);
    if (!matches) throw new HttpError(401, "That password did not match.");
    const jar = await cookies();
    jar.set(
      unlockCookieName(gallery.id),
      createUnlockToken(gallery.id, gallery.passwordVersion),
      unlockCookieOptions(),
    );
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
