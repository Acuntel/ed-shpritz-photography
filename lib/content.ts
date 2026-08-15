import { cache } from "react";
import { del, list, put } from "@vercel/blob";
import type { ClientGallery, Collection, Photo, SiteContent } from "./types";

// Fallback content bundled from the repo. Used at build time and any time the
// Blob store is empty or unreachable, so the site (and a fresh deploy before
// the first seed) never breaks.
import siteJson from "@/public/data/site.json";
import collectionsJson from "@/public/data/collections.json";
import photosJson from "@/public/data/photos.json";
import galleriesJson from "@/public/data/galleries.json";
import importedBestFriendsJson from "@/public/data/imported-our-best-friends.json";
import importedIcmJson from "@/public/data/imported-icm.json";

export type Content = {
  site: SiteContent;
  collections: Collection[];
  photos: Photo[];
  galleries: ClientGallery[];
};

// The single source of truth for everything Ed can edit. One JSON object means
// every publish is atomic — the site never shows a half-applied state.
export const CONTENT_PATH = "content/data.json";

// Every publish first snapshots the CURRENT live content here, so any save
// (even an accidental or stale-draft one) can be rolled back. Ed's work is
// never permanently lost again.
const BACKUP_PREFIX = "content/backups/";
const BACKUP_KEEP = 60;

function bundledContent(): Content {
  return {
    site: siteJson as unknown as SiteContent,
    collections: collectionsJson as unknown as Collection[],
    photos: photosJson as unknown as Photo[],
    galleries: galleriesJson as unknown as ClientGallery[],
  };
}

const bundledImports = [
  ...(importedBestFriendsJson as unknown as Photo[]),
  ...(importedIcmJson as unknown as Photo[]),
];

function mergeBundledImports(content: Content): Content {
  const existingIds = new Set(content.photos.map((photo) => photo.id));
  const missing = bundledImports.filter(
    (photo) => !existingIds.has(photo.id),
  );
  if (missing.length === 0) return content;

  const nextOrder =
    content.photos.reduce((highest, photo) => Math.max(highest, photo.order), -1) +
    1;

  return {
    ...content,
    photos: [
      ...content.photos,
      ...missing.map((photo, index) => ({
        ...photo,
        order: nextOrder + index,
      })),
    ],
  };
}

// Normalize the legacy first name wherever it appears in live Blob content.
// This also updates photo alt text and future admin saves without changing URLs.
function normalizeEd(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\bEdward\b/g, "Ed");
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeEd(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeEd(item)]),
    );
  }
  return value;
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

// Read the live content straight from Blob, or null if the store is empty or
// unreachable. Kept separate from loadContent() so callers that must NOT fall
// back to the bundled copy (e.g. the pre-save backup) can tell "no live data"
// apart from "here is the bundled default".
async function readLiveBlob(): Promise<Content | null> {
  try {
    const url = await contentUrl();
    if (!url) return null;
    // A unique query param forces the read past any edge/CDN cache straight to
    // the (strongly consistent) blob origin, so a publish is visible
    // immediately rather than a few seconds later on some POPs.
    const fresh = `${url}${url.includes("?") ? "&" : "?"}cb=${Date.now()}`;
    const res = await fetch(fresh, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return isContent(data) ? data : null;
  } catch {
    return null;
  }
}

// Read Ed's live content, fresh on every request (no-store) so a publish is
// visible immediately. Falls back to the bundled repo content if Blob is
// empty/unreachable (e.g. local build with no token, or before the first
// seed). Wrapped in React cache() so the many getSite/getPhotos/... calls
// within a single request share ONE Blob fetch.
export const loadContent = cache(
  async function loadContent(): Promise<Content> {
    const content = mergeBundledImports(
      (await readLiveBlob()) ?? bundledContent(),
    );
    return normalizeEd(content) as Content;
  },
);

// Snapshot the CURRENT live content to a timestamped backup before it is
// overwritten. Best-effort: if anything here throws, the real save still
// proceeds — a backup failure must never block Ed from publishing.
async function backupCurrent(): Promise<void> {
  try {
    const current = await readLiveBlob();
    if (!current) return; // nothing live yet (first seed) — nothing to back up
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await put(
      `${BACKUP_PREFIX}data-${stamp}.json`,
      JSON.stringify(current),
      {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 0,
      },
    );
    // Keep the newest BACKUP_KEEP snapshots; prune the rest. ISO timestamps
    // sort lexicographically, so newest = highest pathname.
    const { blobs } = await list({ prefix: BACKUP_PREFIX });
    const stale = blobs
      .sort((a, b) => b.pathname.localeCompare(a.pathname))
      .slice(BACKUP_KEEP);
    if (stale.length) await del(stale.map((b) => b.url));
  } catch {
    // ignore — backups are a safety net, not a publish requirement
  }
}

// Write Ed's content back to Blob. cacheControlMaxAge:0 keeps the CDN from
// serving a stale copy after he publishes. addRandomSuffix:false keeps the URL
// stable so reads always find it. The current live copy is snapshotted first so
// the previous state is always recoverable.
export async function saveContent(content: Content): Promise<void> {
  await backupCurrent();
  const result = await put(CONTENT_PATH, JSON.stringify(content), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
  cachedUrl = result.url;
}
