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

type RecoveredBirdCaption = Pick<Photo, "title" | "description" | "alt">;

// Exact Birds text recovered from the site's saved catalog. Keeping it here
// prevents an older live-content draft from replacing Ed's later titles and
// descriptions again.
const RECOVERED_BIRD_CAPTIONS: Record<string, RecoveredBirdCaption> = {
  "the-clutch": {
    "title": "Goslings",
    "description": "A huddle of goslings tucked into the grass.",
    "alt": "Four downy goslings huddled together in green grass"
  },
  "first-paddle": {
    "title": "Gosling",
    "description": "A single gosling and its reflection on green water.",
    "alt": "A single gosling swimming with its reflection on still green water"
  },
  "two-down": {
    "title": "Mallards landing",
    "description": "Two drakes drop in, feet reaching for the water.",
    "alt": "Two mallard drakes coming in to land on the water with their reflections"
  },
  "the-drake": {
    "title": "Mallard",
    "description": "A drake dips his bill and rings the water.",
    "alt": "Close up of a mallard drake's green head dipping into rippling blue water"
  },
  "cardinal-branch": {
    "title": "Northern cardinal",
    "description": "A cardinal holds his branch against the gray.",
    "alt": "A male northern cardinal perched on a bare branch"
  },
  "chickadee": {
    "title": "Black-capped chickadee",
    "description": "A chickadee swings down for a single seed.",
    "alt": "A black capped chickadee hanging from a twig with a seed in its bill"
  },
  "green-heron": {
    "title": "Green heron",
    "description": "A green heron stands still, waiting out the water.",
    "alt": "A green heron standing in shallow water with its reflection"
  },
  "wingspan": {
    "title": "Goose in flight",
    "description": "Wings open full, coming straight on.",
    "alt": "A goose flying directly toward the camera with wings fully spread, high key"
  },
  "incoming-goose": {
    "title": "Goose in flight",
    "description": "Low and fast over open water.",
    "alt": "A Canada goose flying head on, low over gray water"
  },
  "solo-goose": {
    "title": "Goose at dusk",
    "description": "One goose, low across the water, and gone.",
    "alt": "A single Canada goose flying low over water at dusk with its reflection"
  },
  "p-1781357641666-0": {
    "title": "Moorhen",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781357771604-0": {
    "title": "Osprey",
    "description": "Ready for take of withe fish in its talon",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781357850565-0": {
    "title": " Merganser Female",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358106410-0": {
    "title": "Geese fight B/w",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781357963212-0": {
    "title": "Downy Woodpecker",
    "description": "Looking for the woodpecker I kept hearing, I was told turn around and there it was waiting for its picture to taken! ",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358161576-0": {
    "title": "Merganser Male",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358224200-0": {
    "title": "Seagull Portrait",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358322812-0": {
    "title": "Red Wing Black Bird Male",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358362930-0": {
    "title": " Pruning Mallards",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358470801-0": {
    "title": "Mallard Resting",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358532487-0": {
    "title": "Yellow Warbler",
    "description": "LOOK ... can you see something else? ",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358676409-0": {
    "title": "Wood Duck",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358722979-0": {
    "title": "Female Cardinal",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358848954-0": {
    "title": "Landing Geese",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358889568-0": {
    "title": "Cardinal Portrait Male",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781358967979-0": {
    "title": "Barn Swallow",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  },
  "p-1781359074122-0": {
    "title": "Green Heron Hunting",
    "description": "",
    "alt": "Photograph by Ed Shpritz"
  }
};

function restoreBirdCaption(photo: Photo): Photo {
  if (photo.collection !== "birds") return photo;
  const recovered = RECOVERED_BIRD_CAPTIONS[photo.id];
  return recovered ? { ...photo, ...recovered } : photo;
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
  "natures-fury",
  "wildlife",
  "icm",
  "the-white-city",
  "watercolor",
  "our-best-friends",
  "natures-beauty-and-flight",
  "places-and-reflections",
  "air-and-water-show",
  "time-preserved",
  "life-observed"
] as const;

const CURATED_COLLECTION_COVERS: Record<string, string> = {
  "minimal-white": "/images/gallery/baby-elephant.jpg",
  "birds": "/images/gallery/two-down.jpg",
  "people-of-the-world": "https://fyuetdphxkmzzect.public.blob.vercel-storage.com/gallery/p-1782910215549-0-troubadour-GSH9PPnK5nMatfkDH05bWDuLu8R87g.jpg",
  "wildlife": "/images/gallery/deer-twins.jpg",
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
    .map(restoreBirdCaption)
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
