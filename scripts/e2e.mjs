import { randomBytes } from "node:crypto";
import { del } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import sharp from "sharp";

const base = process.env.E2E_BASE_URL?.replace(/\/$/, "");
const setupToken = process.env.OWNER_SETUP_TOKEN ?? "";
const ownerPassword = process.env.E2E_OWNER_PASSWORD ?? "";
const galleryPassword = `sample-gate-${randomBytes(6).toString("hex")}`;

if (!base || !setupToken || !ownerPassword) {
  console.error("E2E needs E2E_BASE_URL, OWNER_SETUP_TOKEN, and E2E_OWNER_PASSWORD.");
  process.exit(1);
}

class Jar {
  constructor() {
    this.cookies = new Map();
  }

  store(response) {
    const listed = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
    for (const cookie of listed) {
      const pair = cookie.split(";")[0];
      const index = pair.indexOf("=");
      if (index > 0) this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }

  header() {
    return [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; ");
  }
}

async function send(jar, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  if (jar?.header()) headers.set("cookie", jar.header());
  headers.set("origin", base);
  let body = options.body;
  if (body && typeof body !== "string" && !(body instanceof Uint8Array)) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(options.timeoutMs ?? 30000),
  });
  if (jar) jar.store(response);
  return response;
}

async function jpeg(nameMarker) {
  const image = await sharp({
    create: { width: 48, height: 36, channels: 3, background: { r: 170, g: 110, b: 80 } },
  })
    .jpeg()
    .toBuffer();
  if (!nameMarker) return image;
  const comment = Buffer.from(nameMarker, "utf8");
  const length = comment.length + 2;
  const segment = Buffer.concat([
    Buffer.from([0xff, 0xfe, (length >> 8) & 0xff, length & 0xff]),
    comment,
  ]);
  return Buffer.concat([image.subarray(0, 2), segment, image.subarray(2)]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const owner = new Jar();
let galleryId = "";

try {
  const setup = await send(owner, "/api/auth/setup", {
    method: "POST",
    body: { token: setupToken, password: ownerPassword },
  });
  if (setup.status === 409) {
    const login = await send(owner, "/api/auth/login", {
      method: "POST",
      body: { password: ownerPassword },
    });
    assert(login.status === 200, `login failed (${login.status})`);
  } else {
    assert(setup.status === 200, `setup failed (${setup.status})`);
  }

  const denied = await send(null, "/api/galleries", {
    method: "POST",
    body: { name: "should fail", kind: "family", note: "", password: "" },
  });
  assert(denied.status === 401, `anonymous create returned ${denied.status}`);

  const created = await send(owner, "/api/galleries", {
    method: "POST",
    body: {
      name: "Sample session",
      kind: "family",
      note: "Labeled sample photographs for a deployment check.",
      password: galleryPassword,
    },
  });
  const createdBody = await created.json();
  assert(created.status === 200 && createdBody.gallery?.id, "gallery was not created");
  galleryId = createdBody.gallery.id;
  const shareToken = createdBody.gallery.shareToken;

  const files = [
    { name: "sample-window.jpg", bytes: await jpeg(null), type: "image/jpeg" },
    { name: "sample-marker.jpg", bytes: await jpeg("GPSLAT:99.999 PRIVATE-MARKER"), type: "image/jpeg" },
  ];

  for (const file of files) {
    const prepared = await send(owner, `/api/galleries/${galleryId}/photos`, {
      method: "POST",
      body: { name: file.name, type: file.type, size: file.bytes.length },
    });
    const preparedBody = await prepared.json();
    assert(prepared.status === 200 && preparedBody.photoId, `prepare failed for ${file.name}`);
    await upload(preparedBody.pathname, file.bytes, {
      access: "private",
      handleUploadUrl: `${base}/api/galleries/${galleryId}/upload`,
      headers: { cookie: owner.header(), origin: base },
      clientPayload: JSON.stringify({ photoId: preparedBody.photoId }),
      contentType: preparedBody.contentType,
    });
    const finalized = await send(owner, `/api/galleries/${galleryId}/photos/${preparedBody.photoId}/finalize`, {
      method: "POST",
      timeoutMs: 120000,
    });
    assert(finalized.status === 200, `finalize failed for ${file.name} (${finalized.status})`);
  }

  const desk = await send(owner, `/admin/galleries/${galleryId}`);
  const deskHtml = await desk.text();
  assert(desk.status === 200 && deskHtml.includes("sample-marker.jpg"), "owner page lost the upload after save");

  const stranger = new Jar();
  const lockedPage = await send(stranger, `/g/${shareToken}`);
  const lockedHtml = await lockedPage.text();
  assert(lockedPage.status === 200, "client page did not open");
  assert(lockedHtml.includes("password"), "password gate missing");
  assert(!lockedHtml.includes("/api/media/"), "locked page included media addresses");
  assert(!lockedHtml.includes("blob.vercel-storage.com"), "page exposed a blob host");

  const lockedMedia = await send(stranger, `/api/media/${shareToken}/${"0".repeat(22)}`);
  assert(lockedMedia.status === 401 || lockedMedia.status === 404, "media route was open without a password");

  const wrong = await send(stranger, `/api/share/${shareToken}/unlock`, {
    method: "POST",
    body: { password: "not-the-gallery-password" },
  });
  assert(wrong.status === 401, `wrong password returned ${wrong.status}`);

  const unlocked = await send(stranger, `/api/share/${shareToken}/unlock`, {
    method: "POST",
    body: { password: galleryPassword },
  });
  assert(unlocked.status === 200, "correct gallery password was rejected");

  const openPage = await send(stranger, `/g/${shareToken}`);
  const openHtml = await openPage.text();
  assert(openHtml.includes("sample-marker.jpg"), "unlocked gallery did not list the sample");
  assert(!openHtml.includes("blob.vercel-storage.com"), "unlocked page exposed a blob host");
  const photoIds = [...openHtml.matchAll(/data-photo-id="([A-Za-z0-9_-]{22})"/g)].map((match) => match[1]);
  assert(photoIds.length >= 2, "expected both sample photographs");
  let sawMarker = false;
  for (const photoId of photoIds) {
    const display = await send(stranger, `/api/media/${shareToken}/${photoId}`);
    assert(display.status === 200, `display image returned ${display.status}`);
    assert.equal(display.headers.get("location"), null);
    const displayBytes = Buffer.from(await display.arrayBuffer());
    assert.equal(displayBytes.includes(Buffer.from("PRIVATE-MARKER")), false);
    assert.match(display.headers.get("content-type") ?? "", /image\/webp/);
    assert.match(display.headers.get("x-robots-tag") ?? "", /noindex/);
    const original = await send(stranger, `/api/media/${shareToken}/${photoId}/original`);
    assert.equal(original.status, 200);
    assert.match(original.headers.get("content-disposition") ?? "", /attachment/);
    const originalBytes = Buffer.from(await original.arrayBuffer());
    if (originalBytes.includes(Buffer.from("PRIVATE-MARKER"))) sawMarker = true;
  }
  assert(sawMarker, "original download lost the embedded marker");

  const again = await send(stranger, `/g/${shareToken}`);
  assert((await again.text()).includes("sample-window.jpg"), "gallery did not persist after reload");

  const home = await send(null, "/");
  const homeHtml = await home.text();
  assert(!homeHtml.includes("Sample session"), "homepage listed a real gallery");
  assert(!homeHtml.includes(shareToken), "homepage exposed a share token");

  console.log("e2e passed");
} finally {
  if (galleryId) {
    const removed = await send(owner, `/api/galleries/${galleryId}`, { method: "DELETE" });
    if (removed.status !== 200) console.error(`cleanup gallery status ${removed.status}`);
  }
  if (process.env.E2E_DELETE_OWNER === "1" && process.env.BLOB_READ_WRITE_TOKEN) {
    await del("studio/meta/owner.json");
  }
}
