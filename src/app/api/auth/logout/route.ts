import { cookies } from "next/headers";
import { OWNER_COOKIE, ownerCookieOptions } from "@/lib/auth";
import { assertSameOrigin, jsonError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const jar = await cookies();
    jar.set(OWNER_COOKIE, "", { ...ownerCookieOptions(), maxAge: 0 });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
