/** Prefix a public-file path when the static preview is built under a project base path. */
export function publicPath(path: string) {
  const base = (process.env.PAGES_BASE_PATH ?? "").trim().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
