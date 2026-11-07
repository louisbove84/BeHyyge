import { cookies } from "next/headers";
import {
  createOwnerSessionToken,
  OWNER_COOKIE,
  ownerCookieOptions,
  verifyOwnerPassword,
} from "@/lib/auth";
import { assertSameOrigin, HttpError, jsonError, jsonOk, readJsonBody, stringField } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "login");
    const body = await readJsonBody(request);
    const password = stringField(body, "password");
    const ok = await verifyOwnerPassword(password);
    if (!ok) throw new HttpError(401, "Those details did not match.");
    const jar = await cookies();
    jar.set(OWNER_COOKIE, createOwnerSessionToken(), ownerCookieOptions());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
