import type { NextConfig } from "next";

const staticPreview = process.env.STATIC_PREVIEW === "1";
const pagesBase = process.env.PAGES_BASE_PATH?.trim().replace(/\/$/, "") ?? "";

const privateHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "private, no-store" },
];

const nextConfig: NextConfig = {
  ...(staticPreview
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        ...(pagesBase ? { basePath: pagesBase, assetPrefix: pagesBase } : {}),
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(staticPreview
    ? {}
    : {
        async headers() {
          const security = [
            { key: "Referrer-Policy", value: "no-referrer" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ];
          // Keep these off /_next. A catch-all header rule breaks the dev HMR upgrade.
          return [
            { source: "/", headers: security },
            { source: "/book", headers: security },
            { source: "/g/:path*", headers: [...security, ...privateHeaders] },
            { source: "/admin", headers: [...security, ...privateHeaders] },
            { source: "/admin/:path*", headers: [...security, ...privateHeaders] },
            { source: "/api/:path*", headers: [...security, ...privateHeaders] },
          ];
        },
      }),
};

export default nextConfig;
