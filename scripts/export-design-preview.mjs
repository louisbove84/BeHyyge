import { mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const hidden = ["src/app/api", "src/app/admin", "src/app/g", "src/app/robots.ts", "src/app/sitemap.ts"];
const previewFiles = {
  "public/robots.txt": "User-Agent: *\nDisallow: /\n",
  "public/sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>
`,
};
const stash = mkdtempSync(path.join(os.tmpdir(), "behygge-hidden-"));
const moved = [];

for (const rel of hidden) {
  const from = path.join(root, rel);
  const to = path.join(stash, rel);
  mkdirSync(path.dirname(to), { recursive: true });
  renameSync(from, to);
  moved.push({ from, to });
}

function restore() {
  for (const rel of Object.keys(previewFiles)) {
    rmSync(path.join(root, rel), { force: true });
  }
  for (const { from, to } of moved) {
    mkdirSync(path.dirname(from), { recursive: true });
    renameSync(to, from);
  }
}

let exitCode = 0;

try {
  rmSync(path.join(root, ".next"), { recursive: true, force: true });
  for (const [rel, contents] of Object.entries(previewFiles)) {
    writeFileSync(path.join(root, rel), contents);
  }

  const pagesBase = (process.env.PAGES_BASE_PATH ?? "/BeHyyge").trim().replace(/\/$/, "");
  const env = {
    ...process.env,
    STATIC_PREVIEW: "1",
    STUDIO_MODE: "preview",
    PAGES_BASE_PATH: pagesBase,
    SITE_URL: process.env.SITE_URL || "https://louisbove84.github.io",
    BOOKING_URL: "",
    CONTACT_EMAIL: "",
    BLOB_READ_WRITE_TOKEN: "",
    BLOB_STORE_ID: "",
    SESSION_SECRET: "",
    OWNER_SETUP_TOKEN: "",
    OWNER_PASSWORD_HASH: "",
    VERCEL: "",
    VERCEL_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "",
  };

  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const build = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: root,
    env,
    stdio: "inherit",
  });

  if (build.status !== 0) {
    exitCode = build.status ?? 1;
  } else {
    exitCode = checkOutput(pagesBase);
  }
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  restore();
}

process.exit(exitCode);

function checkOutput(pagesBase) {
  const outDir = path.join(root, "out");

  function walk(dir, acc = []) {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full, acc);
      else acc.push(full);
    }
    return acc;
  }

  const files = walk(outDir);
  const rels = files.map((file) => path.relative(outDir, file).split(path.sep).join("/"));
  const forbidden = rels.filter((rel) => /^(admin|api|g)(\/|$)/.test(rel));
  const html = files
    .filter((file) => file.endsWith(".html"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  const problems = [];
  if (forbidden.length) problems.push(`owner or client routes were exported: ${forbidden.join(", ")}`);
  if (html.includes("/admin") || html.includes("Studio desk")) {
    problems.push("studio desk link is in the static preview");
  }
  if (html.includes("booking-email") || html.includes("This form does not send")) {
    problems.push("booking form is in the static preview");
  }
  for (const phrase of [
    "Noncommercial design concept",
    "Bookings are closed",
    "Demo galleries only",
    "instagram.com/behyggephotography",
    "Brittany",
    "Wisconsin",
    "be-hygge-logo.jpg",
    "Hygge (hoo-gah)",
  ]) {
    if (!html.includes(phrase)) problems.push(`missing “${phrase}”`);
  }
  if (pagesBase && !html.includes(`${pagesBase}/brand/be-hygge-logo.jpg`)) {
    problems.push("logo is not prefixed with the GitHub Pages base path");
  }
  for (const frame of ["frame-window.jpg", "frame-linen.jpg", "frame-bloom.jpg", "frame-path.jpg"]) {
    if (pagesBase && !html.includes(`${pagesBase}/demo/${frame}`)) {
      problems.push(`demo frame ${frame} is missing its base path`);
    }
    if (html.includes(`src="/demo/${frame}"`) || html.includes(`src='/demo/${frame}'`)) {
      problems.push(`demo frame ${frame} is not prefixed`);
    }
  }

  const robots = readFileSync(path.join(outDir, "robots.txt"), "utf8");
  if (!robots.includes("Disallow: /")) problems.push("preview robots.txt does not keep the site out of search indexes");

  if (problems.length) {
    console.error(problems.join("\n"));
    return 1;
  }

  console.log(`Static design preview written to out/ (${rels.length} files, base ${pagesBase || "/"}).`);
  return 0;
}
