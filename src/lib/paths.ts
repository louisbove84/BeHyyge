export function ownerPath() {
  return "studio/meta/owner.json";
}

export function indexPath() {
  return "studio/meta/index.json";
}

export function galleryPath(id: string) {
  return `studio/meta/galleries/${id}.json`;
}

export function photosPath(id: string) {
  return `studio/meta/photos/${id}.json`;
}

export function sharePath(token: string) {
  return `studio/meta/shares/${token}.json`;
}

export function rateLimitPath(scope: string, subject: string) {
  return `studio/meta/ratelimit/${scope}/${subject}.json`;
}

export function originalPath(galleryId: string, photoId: string, ext: string) {
  return `studio/originals/${galleryId}/${photoId}.${ext}`;
}

export function displayPath(galleryId: string, photoId: string) {
  return `studio/display/${galleryId}/${photoId}.webp`;
}

export function isOwnedBlobPath(
  pathname: string,
  galleryId: string,
  kind: "originals" | "display",
) {
  const prefix = `studio/${kind}/${galleryId}/`;
  return pathname.startsWith(prefix) && !pathname.includes("..") && !pathname.includes("//");
}
