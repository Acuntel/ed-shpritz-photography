import type { MetadataRoute } from "next";
import { getCollections } from "@/lib/data";

const SITE_URL = "https://edshpritzphotography.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "about", "prints", "contact"].map((p) => ({
    url: `${SITE_URL}/${p}`,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const collectionPages = getCollections().map((c) => ({
    url: `${SITE_URL}/collections/${c.slug}/`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...collectionPages];
}
