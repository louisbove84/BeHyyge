import type { MetadataRoute } from "next";
import { getSite, siteOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (getSite().preview) return [];
  const origin = siteOrigin();
  return [
    { url: origin, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/book`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
