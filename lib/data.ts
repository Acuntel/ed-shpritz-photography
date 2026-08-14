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

const CURATED_COLLECTION_ORDER = [
  "minimal-white",
  "birds",
  "people-of-the-world",
  "wildlife",
  "icm",
  "the-white-city",
  "watercolor",
  "our-best-friends",
  "natures-beauty-and-flight",
  "places-and-reflections",
  "air-and-water-show",
  "time-preserved",
  "natures-fury",
  "life-observed"
] as const;

const CURATED_COLLECTION_COVERS: Record<string, string> = {
  "minimal-white": "/images/gallery/baby-elephant.jpg",
  "birds": "/images/gallery/two-down.jpg",
  "people-of-the-world": "https://fyuetdphxkmzzect.public.blob.vercel-storage.com/gallery/p-1782910215549-0-troubadour-GSH9PPnK5nMatfkDH05bWDuLu8R87g.jpg",
  "wildlife": "/images/gallery/lions-pair.jpg",
  "icm": "/images/gallery/icm-flowers.jpg",
  "the-white-city": "https://fyuetdphxkmzzect.public.blob.vercel-storage.com/gallery/p-1781352725076-0-_dsc1226-6UUpJ3R5iur4CbbndULu51TqStlfiK.jpg",
  "watercolor": "/images/gallery/winter-reflection.jpg",
  "our-best-friends": "/images/uploads/our-best-friends/bf20-rosie1-1.jpg",
  "natures-beauty-and-flight": "/images/gallery/swallowtail-pink.jpg",
  "places-and-reflections": "/images/gallery/garden-bridge.jpg",
  "air-and-water-show": "/images/gallery/thunderbirds-climb.jpg",
  "time-preserved": "https://fyuetdphxkmzzect.public.blob.vercel-storage.com/gallery/p-1785070901299-0-_ehs7574-3-pwFfAO9ARlZDPnLbdN0Kf9i2sTb5pc.jpg",
  "natures-fury": "/images/uploads/nf03.jpg",
  "life-observed": "/images/gallery/summer-jump.jpg"
};

const COLLECTION_RANK = new Map<string, number>(
  CURATED_COLLECTION_ORDER.map((slug, index) => [slug, index]),
);

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
  return collections
    .map((c) => {
      const inIt = photos.filter((p) => p.collection === c.slug);
      const preferredCover = CURATED_COLLECTION_COVERS[c.slug] ?? c.cover;
      const coverExists =
        !!preferredCover && photos.some((p) => p.src === preferredCover);
      return {
        ...c,
        name: c.slug === "time-preserved" ? "Lost in Time" : c.name,
        count: inIt.length,
        // Use the curated cover when available, then safely fall back to a
        // real photograph from the collection.
        cover: coverExists ? preferredCover : (inIt[0]?.src ?? ""),
      };
    })
    .sort(
      (a, b) =>
        (COLLECTION_RANK.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
        (COLLECTION_RANK.get(b.slug) ?? Number.MAX_SAFE_INTEGER),
    );
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
