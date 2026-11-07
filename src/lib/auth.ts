import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { hashPassword, validateOwnerPassword, verifyPassword } from "@/lib/password";
import { ownerPath } from "@/lib/paths";
import { mutateJson, readJson, withBlobErrors } from "@/lib/store";
import { safeEqualString, signToken, verifyToken } from "@/lib/tokens";
import { HttpError } from "@/lib/http";

export const OWNER_COOKIE = "studio_owner";
const OWNER_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type OwnerRecord = {
  passwordHash: string;
  createdAt: string;
};

type OwnerToken = {
  role: "owner";
  exp: number;
};

export function sessionSecret() {
  const value = process.env.SESSION_SECRET?.trim() ?? "";
  if (value.length < 32) return null;
  return value;
}

export function assertSessionSecret() {
  const secret = sessionSecret();
  if (!secret) {
    throw new HttpError(
      503,
      "SESSION_SECRET is not configured. Add a random value of at least 32 characters.",
    );
  }
  return secret;
}

export function ownerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OWNER_MAX_AGE_SECONDS,
  };
}

export function setupTokenConfigured() {
  return (process.env.OWNER_SETUP_TOKEN?.trim().length ?? 0) >= 24;
}

function ownerHashFromEnv() {
  const value = process.env.OWNER_PASSWORD_HASH?.trim() ?? "";
  if (!value) return null;
  if (!value.startsWith("scrypt$")) {
    throw new HttpError(
      503,
      "OWNER_PASSWORD_HASH is set, but it is not a scrypt hash from npm run hash-password.",
    );
  }
  return value;
}

export async function ownerRecord() {
  if (ownerHashFromEnv()) return { source: "env" as const };
  const record = await readJson<OwnerRecord>(ownerPath());
  return record ? { source: "stored" as const } : null;
}

export async function activePasswordHash() {
  const fromEnv = ownerHashFromEnv();
  if (fromEnv) return fromEnv;
  const record = await readJson<OwnerRecord>(ownerPath());
  return record?.value.passwordHash ?? null;
}

let dummyHash: Promise<string> | null = null;

function dummyPasswordHash() {
  dummyHash ??= hashPassword("not-a-real-owner-password-value");
  return dummyHash;
}

export async function verifyOwnerPassword(password: string) {
  const hash = await activePasswordHash();
  if (!hash) {
    await verifyPassword(password, await dummyPasswordHash());
    return false;
  }
  return verifyPassword(password, hash);
}

export async function createOwner(password: string, setupToken: string) {
  if (ownerHashFromEnv()) {
    throw new HttpError(409, "Sign-in is already controlled by OWNER_PASSWORD_HASH.");
  }
  if (!setupTokenConfigured()) {
    throw new HttpError(503, "OWNER_SETUP_TOKEN is not configured yet.");
  }
  const expected = process.env.OWNER_SETUP_TOKEN?.trim() ?? "";
  if (!safeEqualString(setupToken, expected)) {
    throw new HttpError(401, "That setup token did not match.");
  }
  const passwordError = validateOwnerPassword(password);
  if (passwordError) throw new HttpError(400, passwordError);
  const existing = await readJson<OwnerRecord>(ownerPath());
  if (existing) throw new HttpError(409, "An owner sign-in already exists.");
  const passwordHash = await hashPassword(password);
  await withBlobErrors(() =>
    mutateJson<OwnerRecord>(
      ownerPath(),
      () => ({ passwordHash, createdAt: new Date().toISOString() }),
      () => {
        throw new HttpError(409, "An owner sign-in already exists.");
      },
    ),
  );
}

export function createOwnerSessionToken() {
  const secret = assertSessionSecret();
  return signToken(
    { role: "owner", exp: Date.now() + OWNER_MAX_AGE_SECONDS * 1000 },
    secret,
  );
}

export async function getOwnerSession() {
  const secret = sessionSecret();
  if (!secret) return null;
  const jar = await cookies();
  const raw = jar.get(OWNER_COOKIE)?.value;
  if (!raw) return null;
  const payload = verifyToken<OwnerToken>(raw, secret);
  if (!payload || payload.role !== "owner" || !Number.isFinite(payload.exp)) return null;
  if (payload.exp <= Date.now()) return null;
  return { role: "owner" as const };
}

export async function requireOwner() {
  const session = await getOwnerSession();
  if (!session) throw new HttpError(401, "Sign in to continue.");
  return session;
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const secret = assertSessionSecret();
  return createHash("sha256").update(`${secret}:${ip}`).digest("base64url").slice(0, 32);
}
