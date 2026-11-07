import { cookies } from "next/headers";
import {
  createOwner,
  createOwnerSessionToken,
  OWNER_COOKIE,
  ownerCookieOptions,
} from "@/lib/auth";
import { assertSameOrigin, jsonError, jsonOk, readJsonBody, stringField } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "setup");
    const body = await readJsonBody(request);
    await createOwner(stringField(body, "password"), stringField(body, "token"));
    const jar = await cookies();
    jar.set(OWNER_COOKIE, createOwnerSessionToken(), ownerCookieOptions());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
