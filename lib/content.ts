import { cache } from "react";
import { list, put } from "@vercel/blob";
import type { ClientGallery, Collection, Photo, SiteContent } from "./types";

// Fallback content bundled from the repo. Used at build time and any time the
// Blob store is empty or unreachable, so the site (and a fresh deploy before
// the first seed) never breaks.
import siteJson from "@/public/data/site.json";
import collectionsJson from "@/public/data/collections.json";
import photosJson from "@/public/data/photos.json";
import galleriesJson from "@/public/data/galleries.json";

export type Content = {
  site: SiteContent;
  collections: Collection[];
  photos: Photo[];
  galleries: ClientGallery[];
};

// The single source of truth for everything Ed can edit. One JSON object means
// every publish is atomic — the site never shows a half-applied state.
export const CONTENT_PATH = "content/data.json";

function bundledContent(): Content {
  return {
    site: siteJson as unknown as SiteContent,
    collections: collectionsJson as unknown as Collection[],
    photos: photosJson as unknown as Photo[],
    galleries: galleriesJson as unknown as ClientGallery[],
  };
}

// The public URL of the content blob is stable (addRandomSuffix:false), so we
// resolve it once per server instance and reuse it.
let cachedUrl: string | null = null;

async function contentUrl(): Promise<string | null> {
  if (cachedUrl) return cachedUrl;
  const { blobs } = await list({ prefix: CONTENT_PATH, limit: 1 });
  const match = blobs.find((b) => b.pathname === CONTENT_PATH) ?? blobs[0];
  cachedUrl = match?.url ?? null;
  return cachedUrl;
}

function isContent(x: unknown): x is Content {
  const c = x as Content;
  return (
    !!c &&
    !!c.site &&
    Array.isArray(c.collections) &&
    Array.isArray(c.photos) &&
    Array.isArray(c.galleries)
  );
}

// Read Ed's live content from Blob, fresh on every request (no-store) so a
// publish is visible immediately. Falls back to the bundled repo content if
// Blob is empty/unreachable (e.g. local build with no token, or before the
// first seed). Wrapped in React cache() so the many getSite/getPhotos/... calls
// within a single request share ONE Blob fetch.
export const loadContent = cache(
  async function loadContent(): Promise<Content> {
    try {
      const url = await contentUrl();
      if (url) {
        // A unique query param forces the read past any edge/CDN cache straight
        // to the (strongly consistent) blob origin, so a publish is visible
        // immediately rather than a few seconds later on some POPs.
        const fresh = `${url}${url.includes("?") ? "&" : "?"}cb=${Date.now()}`;
        const res = await fetch(fresh, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isContent(data)) return data;
        }
      }
    } catch {
      // No token, store empty, or network hiccup — use the bundled copy.
    }
    return bundledContent();
  },
);

// Write Ed's content back to Blob. cacheControlMaxAge:0 keeps the CDN from
// serving a stale copy after he publishes. addRandomSuffix:false keeps the URL
// stable so reads always find it.
export async function saveContent(content: Content): Promise<void> {
  const result = await put(CONTENT_PATH, JSON.stringify(content), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
  cachedUrl = result.url;
}
