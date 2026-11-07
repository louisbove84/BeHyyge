import type { MetadataRoute } from "next";
import { getSite } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (getSite().preview) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/g/", "/api/"],
    },
  };
}
