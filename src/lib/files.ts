export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const TYPE_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
} as const;

type AllowedType = keyof typeof TYPE_TO_EXT;

const EXT_TO_TYPE: Record<string, AllowedType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export const ALLOWED_CONTENT_TYPES = Object.keys(TYPE_TO_EXT);

export function sanitizeFilename(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "photograph";
  const cleaned = base.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return (cleaned || "photograph").slice(0, 120);
}

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function sameFamily(left: AllowedType, right: AllowedType) {
  if (left === right) return true;
  const heif = left === "image/heic" || left === "image/heif";
  const other = right === "image/heic" || right === "image/heif";
  return heif && other;
}

export function validateImageUpload(input: { name: string; type: string; size: number }):
  | { ok: true; contentType: AllowedType; ext: string; originalName: string }
  | { ok: false; error: string } {
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (input.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Each photograph must be 25 MB or smaller." };
  }

  const originalName = sanitizeFilename(input.name);
  const fromExt = EXT_TO_TYPE[extensionOf(originalName)];
  const declared = input.type.trim().toLowerCase();
  const fromType = declared in TYPE_TO_EXT ? (declared as AllowedType) : undefined;

  if (fromType && fromExt && !sameFamily(fromType, fromExt)) {
    return { ok: false, error: "The file type does not match its name." };
  }

  const contentType = fromType ?? fromExt;
  if (!contentType) {
    return { ok: false, error: "Use a JPEG, PNG, WebP, or HEIC photograph." };
  }

  return { ok: true, contentType, ext: TYPE_TO_EXT[contentType], originalName };
}

export function attachmentDisposition(filename: string) {
  const cleaned = sanitizeFilename(filename).replace(/["\\]/g, "");
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, "_") || "photograph";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}
