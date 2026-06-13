import fs from "node:fs";
import path from "node:path";
import type {
  ClientGallery,
  Collection,
  GalleryPhoto,
  Photo,
  SiteContent,
} from "./types";

const dataDir = path.join(process.cwd(), "public", "data");

function read<T>(file: string): T {
  const raw = fs.readFileSync(path.join(dataDir, file), "utf8");
  return JSON.parse(raw) as T;
}

// Optional image metadata produced by scripts/optimize.mjs. Missing is fine —
// the site simply falls back to the original images.
type IMeta = Record<
  string,
  { widths: number[]; lqip: string; width: number; height: number }
>;

function readMeta(): IMeta {
  try {
    return read<IMeta>("imeta.json");
  } catch {
    return {};
  }
}

function baseFromSrc(src: string): string {
  const file = src.split("/").pop() ?? "";
  return file.replace(/\.[a-z0-9]+$/i, "");
}

function enrichPhoto(p: Photo, meta: IMeta): Photo {
  const base = baseFromSrc(p.src);
  const m = meta[base];
  if (!m) return p;
  return {
    ...p,
    optBase: base,
    optWidths: m.widths,
    lqip: m.lqip,
    width: m.width,
    height: m.height,
  };
}

export function getSite(): SiteContent {
  return read<SiteContent>("site.json");
}

export function getPhotos(): Photo[] {
  const meta = readMeta();
  return read<Photo[]>("photos.json")
    .map((p) => enrichPhoto(p, meta))
    .sort((a, b) => a.order - b.order);
}

export function getCollections(): Collection[] {
  const photos = getPhotos();
  return read<Collection[]>("collections.json").map((c) => {
    const inIt = photos.filter((p) => p.collection === c.slug);
    const coverExists = !!c.cover && photos.some((p) => p.src === c.cover);
    return {
      ...c,
      count: inIt.length,
      // Always resolve to a real photo: the named cover if it still exists,
      // otherwise the first photo in the collection, otherwise empty.
      cover: coverExists ? c.cover : (inIt[0]?.src ?? ""),
    };
  });
}

export function getTriggerPhotos(): Photo[] {
  return getPhotos().filter((p) => p.trigger);
}

export function getCollection(slug: string): Collection | undefined {
  return getCollections().find((c) => c.slug === slug);
}

export function getPhotosByCollection(slug: string): Photo[] {
  return getPhotos().filter((p) => p.collection === slug);
}

function enrichGalleryPhoto(p: GalleryPhoto, meta: IMeta): GalleryPhoto {
  const base = baseFromSrc(p.src);
  const m = meta[base];
  if (!m) return p;
  return {
    ...p,
    optBase: base,
    optWidths: m.widths,
    lqip: m.lqip,
    width: m.width,
    height: m.height,
  };
}

// Private client galleries. Missing galleries.json is fine — returns [].
export function getGalleries(): ClientGallery[] {
  const meta = readMeta();
  let raw: ClientGallery[];
  try {
    raw = read<ClientGallery[]>("galleries.json");
  } catch {
    return [];
  }
  return raw.map((g) => ({
    ...g,
    photos: (g.photos ?? []).map((p) => enrichGalleryPhoto(p, meta)),
  }));
}

export function getGallery(token: string): ClientGallery | undefined {
  return getGalleries().find((g) => g.token === token);
}
