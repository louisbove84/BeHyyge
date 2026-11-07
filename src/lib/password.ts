import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const BLOCKED = new Set([
  "password",
  "password1",
  "password123",
  "admin",
  "admin123",
  "changeme",
  "qwerty123",
  "letmein123",
  "studio1234",
  "password12345",
]);

export function validateOwnerPassword(password: string) {
  if (password.length < 12 || password.length > 200) {
    return "Use a password of at least 12 characters.";
  }
  if (BLOCKED.has(password.toLowerCase())) {
    return "Choose a less common password.";
  }
  return null;
}

export function validateGalleryPassword(password: string) {
  if (password.length < 8 || password.length > 200) {
    return "A gallery password needs at least 8 characters.";
  }
  if (BLOCKED.has(password.toLowerCase())) {
    return "Choose a less common gallery password.";
  }
  return null;
}

function scryptKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptKey(password, salt);
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltPart, hashPart] = parts;
  if (!saltPart || !hashPart || n !== "16384" || r !== "8" || p !== "1") return false;
  const salt = Buffer.from(saltPart, "base64url");
  const expected = Buffer.from(hashPart, "base64url");
  const actual = await scryptKey(password, salt);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
