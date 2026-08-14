import type {
  ClientGallery,
  Collection,
  GalleryPhoto,
  Photo,
  SiteContent,
} from "./types";
import { loadContent } from "./content";
import imetaJson from "@/public/data/imeta.json";

// Image metadata produced long ago by scripts/optimize.mjs for the original
// gallery images — gives them width/height/lqip so they get a correct aspect
// ratio and blur-up. New photos Ed uploads carry their own width/height/lqip
// (captured in the browser at upload time), so they never need this map.
type IMeta = Record<
  string,
  { widths: number[]; lqip: string; width: number; height: number }
>;
const meta = imetaJson as unknown as IMeta;

function baseFromSrc(src: string): string {
  const file = src.split("/").pop() ?? "";
  return file.replace(/\.[a-z0-9]+$/i, "");
}

// Fill width/height/lqip from the legacy meta map ONLY when the photo doesn't
// already describe itself.
function enrichPhoto<
  T extends { src: string; width?: number; height?: number; lqip?: string },
>(p: T): T {
  if (p.width && p.height) return p;
  const m = meta[baseFromSrc(p.src)];
  if (!m) return p;
  return { ...p, lqip: p.lqip ?? m.lqip, width: m.width, height: m.height };
}

const PHOTO_COLLECTION_CODES: Record<string, string> = {
  "minimal-white": "MO",
  watercolor: "WC",
  "places-and-reflections": "PR",
  "the-white-city": "BW",
  wildlife: "WL",
  "natures-beauty-and-flight": "NB",
  birds: "BI",
  icm: "IC",
  "our-best-friends": "BF",
  "people-of-the-world": "PW",
  "air-and-water-show": "AW",
  "natures-fury": "NF",
  "time-preserved": "TP",
  "life-observed": "LO",
};

function collectionCode(collection: string): string {
  return (
    PHOTO_COLLECTION_CODES[collection] ??
    collection
      .split("-")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    "PH"
  );
}

// Give every public photo a stable-looking catalog label while keeping the
// collection's existing display order. Each collection has its own counter, so
// Minimal White is MO01, MO02, ... and WaterColor starts over at WC01.
function fixCaptionTypos(photo: Photo): Photo {
  if (photo.id !== "p-1786020015256-0") return photo;
  return {
    ...photo,
    description: photo.description.replace(
      "Franklin Street Bridge0",
      "Franklin Street Bridge)",
    ),
  };
}

function numberPhotosByCollection(photos: Photo[]): Photo[] {
  const counters = new Map<string, number>();

  return photos.map((photo) => {
    const sequence = (counters.get(photo.collection) ?? 0) + 1;
    counters.set(photo.collection, sequence);

    return {
      ...photo,
      name: `${collectionCode(photo.collection)}${String(sequence).padStart(2, "0")}`,
    };
  });
}

export async function getSite(): Promise<SiteContent> {
  return (await loadContent()).site;
}

export async function getPhotos(): Promise<Photo[]> {
  const { photos } = await loadContent();
  const ordered = photos
    .map(enrichPhoto)
    .map(fixCaptionTypos)
    .sort((a, b) => a.order - b.order);
  return numberPhotosByCollection(ordered);
}

export async function getCollections(): Promise<Collection[]> {
  const { collections } = await loadContent();
  const photos = await getPhotos();
  return collections.map((c) => {
    const inIt = photos.filter((p) => p.collection === c.slug);
    const coverExists = !!c.cover && photos.some((p) => p.src === c.cover);
    return {
      ...c,
      name: c.slug === "time-preserved" ? "Lost in Time" : c.name,
      count: inIt.length,
      // Always resolve to a real photo: the named cover if it still exists,
      // otherwise the first photo in the collection, otherwise empty.
      cover: coverExists ? c.cover : (inIt[0]?.src ?? ""),
    };
  });
}

export async function getTriggerPhotos(): Promise<Photo[]> {
  return (await getPhotos()).filter((p) => p.trigger);
}

export async function getCollection(
  slug: string,
): Promise<Collection | undefined> {
  return (await getCollections()).find((c) => c.slug === slug);
}

export async function getPhotosByCollection(slug: string): Promise<Photo[]> {
  return (await getPhotos()).filter((p) => p.collection === slug);
}

// Private client galleries. Missing/empty is fine — returns [].
export async function getGalleries(): Promise<ClientGallery[]> {
  const { galleries } = await loadContent();
  if (!Array.isArray(galleries)) return [];
  return galleries.map((g) => ({
    ...g,
    photos: (g.photos ?? []).map((p) => enrichPhoto<GalleryPhoto>(p)),
  }));
}

export async function getGallery(
  token: string,
): Promise<ClientGallery | undefined> {
  return (await getGalleries()).find((g) => g.token === token);
}
