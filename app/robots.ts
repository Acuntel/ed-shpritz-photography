import type { MetadataRoute } from "next";

const SITE_URL = "https://edshpritzphotography.com";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // Private client galleries live under /gallery/<token>/ and must never be
    // indexed — they are unlisted, shared only by direct link.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/gallery"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
