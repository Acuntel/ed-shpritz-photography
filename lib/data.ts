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

// The cloud collection is intentionally empty until Ed supplies its first
// photographs. Keeping this presentation-level definition here means it is
// live without changing the site's stored content or publishing system.
const DO_YOU_SEE_COLLECTION: Collection = {
  slug: "do-you-see-what-i-see",
  name: "Do You See What I See?",
  kicker: "",
  blurb: "",
  intro:
    "Ever look up? See a cloud looking like a bear, a face, or even a dragon? Look, imagine, smile, then match it to what I see! And have fun.",
  cover: "",
};

function withDoYouSeeFirst(collections: Collection[]): Collection[] {
  const existing = collections.find(
    (collection) => collection.slug === DO_YOU_SEE_COLLECTION.slug,
  );
  return [
    existing ?? DO_YOU_SEE_COLLECTION,
    ...collections.filter(
      (collection) => collection.slug !== DO_YOU_SEE_COLLECTION.slug,
    ),
  ];
}

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

// Admin is the single source of truth for visitor content. Public pages preserve
// its names, captions, awards, and covers; the reserved cloud collection is shown
// first until Ed supplies its photographs. Only technical metadata is filled in.

export async function getSite(): Promise<SiteContent> {
  return (await loadContent()).site;
}

export async function getPhotos(): Promise<Photo[]> {
  const { photos } = await loadContent();
  return photos
    .filter((photo) => photo.published !== false)
    .map(enrichPhoto)
    .sort((a, b) => a.order - b.order);
}

export async function getCollections(): Promise<Collection[]> {
  const { collections } = await loadContent();
  const photos = await getPhotos();
  return withDoYouSeeFirst(collections).map((collection) => {
    const collectionPhotos = photos.filter(
      (photo) => photo.collection === collection.slug,
    );
    const resolvedCover =
      collection.cover &&
      collectionPhotos.some((photo) => photo.src === collection.cover)
        ? collection.cover
        : (collectionPhotos[0]?.src ?? "");
    return {
      ...collection,
      count: collectionPhotos.length,
      cover: resolvedCover,
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
