import type { MetadataRoute } from "next";
import { getCollections } from "@/lib/data";

const SITE_URL = "https://edshpritzphotography.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // trailingSlash: true, so paths carry a trailing slash — keep sitemap URLs
  // consistent with the page canonicals.
  const staticPages = ["", "about", "prints", "contact"].map((p) => ({
    url: p === "" ? `${SITE_URL}/` : `${SITE_URL}/${p}/`,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const collectionPages = (await getCollections()).map((c) => ({
    url: `${SITE_URL}/collections/${c.slug}/`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...collectionPages];
}
