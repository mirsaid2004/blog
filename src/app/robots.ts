import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Admin pages are also noindex; API routes have nothing to index.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/*/admin"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
