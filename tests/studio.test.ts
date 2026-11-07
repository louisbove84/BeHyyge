import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { canViewGallery } from "../src/lib/access";
import { validateImageUpload, attachmentDisposition } from "../src/lib/files";
import { createId, createShareToken, isId, isShareToken } from "../src/lib/ids";
import { makeDisplayWebp } from "../src/lib/images";
import { isOwnedBlobPath, originalPath } from "../src/lib/paths";
import { hashPassword, validateGalleryPassword, validateOwnerPassword, verifyPassword } from "../src/lib/password";
import { nextRateCount } from "../src/lib/rate";
import { INSTAGRAM_URL, STUDIO_MOTTO, studioMode } from "../src/lib/profile";
import { safeHttpUrl } from "../src/lib/urls";
import { safeEqualString, signToken, verifyToken } from "../src/lib/tokens";

test("ids are high entropy and match the expected shape", () => {
  const id = createId();
  const token = createShareToken();
  assert.equal(isId(id), true);
  assert.equal(isShareToken(token), true);
  assert.equal(createShareToken() === token, false);
  assert.equal(isShareToken("../etc/passwd"), false);
  assert.equal(isId(`${id}extra`), false);
});

test("owner and gallery passwords reject short and common values", () => {
  assert.match(validateOwnerPassword("short-pass") ?? "", /12/);
  assert.match(validateOwnerPassword("password12345") ?? "", /less common/);
  assert.equal(validateOwnerPassword("a-long-unique-passphrase"), null);
  assert.match(validateGalleryPassword("tiny") ?? "", /8/);
  assert.equal(validateGalleryPassword("family-gate"), null);
});

test("password hashes verify and reject mismatches", async () => {
  const encoded = await hashPassword("correct horse battery");
  assert.equal(await verifyPassword("correct horse battery", encoded), true);
  assert.equal(await verifyPassword("wrong horse battery", encoded), false);
  assert.equal(await verifyPassword("correct horse battery", "scrypt$16384$8$1$aaaa$bbbb"), false);
});

test("session tokens reject tampering and expiry checks stay outside the signer", () => {
  const secret = "test-secret-that-is-long-enough-for-hmac";
  const token = signToken({ role: "owner", exp: 100 }, secret);
  const payload = verifyToken<{ role: string; exp: number }>(token, secret);
  assert.deepEqual(payload, { role: "owner", exp: 100 });
  assert.equal(verifyToken(token, "another-secret-that-is-long-enough"), null);
  const [body, signature] = token.split(".");
  assert.equal(verifyToken(`${body}.${signature.slice(0, -1)}a`, secret), null);
  assert.equal(safeEqualString("same-token", "same-token"), true);
  assert.equal(safeEqualString("same-token", "other-token"), false);
});

test("gallery access requires a matching unexpired unlock", () => {
  const now = 1_000;
  assert.equal(
    canViewGallery({
      galleryId: "gallery",
      hasPassword: false,
      passwordVersion: 1,
      claims: null,
      now,
    }),
    true,
  );
  assert.equal(
    canViewGallery({
      galleryId: "gallery",
      hasPassword: true,
      passwordVersion: 2,
      claims: null,
      now,
    }),
    false,
  );
  assert.equal(
    canViewGallery({
      galleryId: "gallery",
      hasPassword: true,
      passwordVersion: 2,
      claims: { galleryId: "gallery", passwordVersion: 1, exp: now + 10 },
      now,
    }),
    false,
  );
  assert.equal(
    canViewGallery({
      galleryId: "gallery",
      hasPassword: true,
      passwordVersion: 2,
      claims: { galleryId: "other", passwordVersion: 2, exp: now + 10 },
      now,
    }),
    false,
  );
  assert.equal(
    canViewGallery({
      galleryId: "gallery",
      hasPassword: true,
      passwordVersion: 2,
      claims: { galleryId: "gallery", passwordVersion: 2, exp: now },
      now,
    }),
    false,
  );
  assert.equal(
    canViewGallery({
      galleryId: "gallery",
      hasPassword: true,
      passwordVersion: 2,
      claims: { galleryId: "gallery", passwordVersion: 2, exp: now + 10 },
      now,
    }),
    true,
  );
});

test("uploads accept photographs and reject other files", () => {
  const jpeg = validateImageUpload({ name: "park.jpg", type: "image/jpeg", size: 1200 });
  assert.equal(jpeg.ok && jpeg.ext, "jpg");
  const heic = validateImageUpload({ name: "phone.HEIC", type: "", size: 2000 });
  assert.equal(heic.ok && heic.contentType, "image/heic");
  assert.equal(validateImageUpload({ name: "notes.svg", type: "image/svg+xml", size: 100 }).ok, false);
  assert.equal(validateImageUpload({ name: "photo.jpg", type: "image/png", size: 100 }).ok, false);
  assert.equal(validateImageUpload({ name: "big.jpg", type: "image/jpeg", size: 26 * 1024 * 1024 }).ok, false);
  assert.match(attachmentDisposition('family "day".jpg'), /attachment/);
});

test("blob paths stay inside the gallery", () => {
  const galleryId = createId();
  const photoId = createId();
  const path = originalPath(galleryId, photoId, "jpg");
  assert.equal(isOwnedBlobPath(path, galleryId, "originals"), true);
  assert.equal(isOwnedBlobPath(`studio/originals/${galleryId}/../secret.jpg`, galleryId, "originals"), false);
  assert.equal(isOwnedBlobPath(`studio/originals/other/${photoId}.jpg`, galleryId, "originals"), false);
});

test("rate windows reset and stop at the limit", () => {
  const first = nextRateCount(null, 1_000, 100, 2);
  assert.deepEqual(first, { windowStart: 1_000, count: 1, allowed: true });
  const second = nextRateCount(first, 1_010, 100, 2);
  assert.equal(second.allowed, true);
  assert.equal(second.count, 2);
  const blocked = nextRateCount(second, 1_020, 100, 2);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.count, 2);
  const reset = nextRateCount(blocked, 1_200, 100, 2);
  assert.equal(reset.allowed, true);
  assert.equal(reset.count, 1);
});

test("preview is the default and the approved profile stays fixed", () => {
  assert.equal(studioMode(undefined), "preview");
  assert.equal(studioMode("preview"), "preview");
  assert.equal(studioMode("OPEN"), "open");
  assert.equal(studioMode("commercial"), "preview");
  assert.equal(
    STUDIO_MOTTO,
    "Hygge (hoo-gah): a Danish concept of warmth, connection, and finding beauty in life\u2019s simple moments.",
  );
  assert.equal(INSTAGRAM_URL, "https://www.instagram.com/behyggephotography/");
});

test("booking links only allow http(s)", () => {
  assert.equal(safeHttpUrl("https://example.com/book"), "https://example.com/book");
  assert.equal(safeHttpUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpUrl(""), null);
});

test("display derivatives drop embedded comment markers", async () => {
  const jpeg = await sharp({
    create: { width: 40, height: 30, channels: 3, background: { r: 180, g: 120, b: 90 } },
  })
    .jpeg()
    .toBuffer();
  const comment = Buffer.from("GPSLAT:99.999 PRIVATE-MARKER", "utf8");
  const length = comment.length + 2;
  const segment = Buffer.concat([
    Buffer.from([0xff, 0xfe, (length >> 8) & 0xff, length & 0xff]),
    comment,
  ]);
  const marked = Buffer.concat([jpeg.subarray(0, 2), segment, jpeg.subarray(2)]);
  assert.equal(marked.includes(Buffer.from("PRIVATE-MARKER")), true);
  const display = await makeDisplayWebp(marked);
  assert.equal(display.bytes.includes(Buffer.from("PRIVATE-MARKER")), false);
  const metadata = await sharp(display.bytes).metadata();
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.format, "webp");
});
