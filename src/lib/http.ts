import "server-only";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status, headers: PRIVATE_HEADERS });
  }
  const name = error instanceof Error ? error.name : "Error";
  console.error(`request failed: ${name}`);
  return Response.json(
    { error: "Something went wrong. Try again." },
    { status: 500, headers: PRIVATE_HEADERS },
  );
}

export function jsonOk(data: unknown, status = 200) {
  return Response.json(data, { status, headers: PRIVATE_HEADERS });
}

export async function readJsonBody(request: Request) {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new HttpError(400, "The request could not be read.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "The request could not be read.");
  }
  return value as Record<string, unknown>;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) {
    throw new HttpError(403, "This action must come from the studio site.");
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "This action must come from the studio site.");
  }
  if (originHost !== host) {
    throw new HttpError(403, "This action must come from the studio site.");
  }
}

export function stringField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

export function booleanField(body: Record<string, unknown>, key: string) {
  return body[key] === true;
}
