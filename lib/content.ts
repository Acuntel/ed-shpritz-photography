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
import importedAirWaterJson from "@/public/data/imported-air-water.json";
import importedAirWater2Json from "@/public/data/imported-air-water-2.json";
import importedBeautyFlightJson from "@/public/data/imported-beauty-flight.json";
import importedBestFriendsJson from "@/public/data/imported-our-best-friends.json";
import importedIcmJson from "@/public/data/imported-icm.json";
import importedLifeObservedJson from "@/public/data/imported-life-observed.json";
import importedPlacesReflectionsJson from "@/public/data/imported-places-reflections.json";
import importedBlackAndWhiteJson from "@/public/data/imported-black-and-white.json";
import importedPeopleWorldJson from "@/public/data/imported-people-world.json";
import importedWildlifeJson from "@/public/data/imported-wildlife.json";

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
  ...(importedAirWaterJson as unknown as Photo[]),
  ...(importedAirWater2Json as unknown as Photo[]),
  ...(importedBeautyFlightJson as unknown as Photo[]),
  ...(importedBestFriendsJson as unknown as Photo[]),
  ...(importedIcmJson as unknown as Photo[]),
  ...(importedLifeObservedJson as unknown as Photo[]),
  ...(importedPlacesReflectionsJson as unknown as Photo[]),
  ...(importedBlackAndWhiteJson as unknown as Photo[]),
  ...(importedPeopleWorldJson as unknown as Photo[]),
  ...(importedWildlifeJson as unknown as Photo[]),
];

function mergeBundledImports(content: Content): Content {
  const existingIds = new Set(content.photos.map((photo) => photo.id));
  const missing = bundledImports.filter(
    (photo) => !existingIds.has(photo.id),
  );
  if (missing.length === 0) return content;

  return {
    ...content,
    // Keep each imported record's established order. Those values are what the
    // public collections already use, so the admin receives the same sequence.
    photos: [...content.photos, ...missing],
  };
}

// Ed's August 2026 Wildlife list is applied exactly once, by stable photo ID.
// The migration marker lives inside the site object because the admin editor
// preserves that object on every publish. After the first corrected save,
// future title and description edits remain Ed's source of truth.
const WILDLIFE_LIST_MIGRATION = "wildlife-list-2026-08-20";
const CONFIRMED_WILDLIFE_DUPLICATES = new Set([
  "wl-lone-bison",
  "wl-hippos-at-rest",
]);

const WILDLIFE_CORRECTIONS: Record<
  string,
  Pick<Photo, "name" | "title" | "description">
> = {
  "lions-pair": {
    name: "WL01",
    title: "MODELS",
    description: "Why’s everyone looking at us?",
  },
  giraffes: {
    name: "WL02",
    title: "Let’s take a walk",
    description: "What tall tale do you want next?",
  },
  zebras: {
    name: "WL03",
    title: "Finally…",
    description: "a little peace for a cool drink",
  },
  "elephant-portrait": {
    name: "WL04",
    title: "HEY Guys….",
    description: "so now I know how to rest that schnoz…",
  },
  "elephants-walking": {
    name: "WL05",
    title: "NOW…",
    description: "… all together .. Stop… Smile ! Thank you!",
  },
  rhinos: { name: "WL08", title: "MY-", description: "MINI ME!" },
  "hippo-yawn": {
    name: "WL07",
    title: "Splish ..splash ..",
    description: "JUST…Taking … A ….",
  },
  wildebeest: {
    name: "WL42",
    title: "Boy do I have a story!",
    description: "Did you hear the one about Custer?",
  },
  "deer-twins": {
    name: "WL09",
    title: "Twins",
    description: "We’d prefer our story—“Bambi”!",
  },
  turtles: { name: "WL10", title: "BABY!", description: "Hugs coming!" },
  "wl-elephant-at-water": {
    name: "WL11",
    title: "DONT BOTHER ME…",
    description:
      "A LITTLE SALAD.. THEN A DRINK.. MORE SALAD.. GREAT LUNCH!",
  },
  "wl-young-gorilla": {
    name: "WL12",
    title: "What a face",
    description: "Take the picture already.. I can’t hold on forever",
  },
  "wl-tree-squirrel": {
    name: "WL13",
    title: "Oh Nuts..",
    description: "finish the story already!",
  },
  "wl-baboons-in-mist": {
    name: "WL14",
    title: "A special moment.",
    description: "Love is forever…",
  },
  "wl-giraffe-in-tree": {
    name: "WL15",
    title: "Just a little snack..",
    description: "Those Darn Thorns..",
  },
  "wl-zebras-at-water": {
    name: "WL31",
    title: "Family Time",
    description: "Let me tell you a story.. Am I in the story?",
  },
  "wl-baboon-and-young": {
    name: "WL40",
    title: "Mother’s Day",
    description: "Love!",
  },
  "wl-hippo-in-reeds": {
    name: "WL28",
    title: "HIDING",
    description: "“Peek-a-boo!” I see….",
  },
  "wl-protected-baby": {
    name: "WL21",
    title: "Cute",
    description: "Just Cute!",
  },
  "wl-gorilla-in-leaves": {
    name: "WL22",
    title: "Marco",
    description: "Polo… Bet cant find me!",
  },
  "wl-leopard-in-tree": {
    name: "WL23",
    title: "Waiting for the Story",
    description:
      "Don’t leave me hanging again…I’m tired of these no-ending stories!",
  },
  "wl-mountain-goat": {
    name: "WL24",
    title: "BAAAAA….",
    description: "I’m a goat. Keep me out of the story!",
  },
  "wl-bison-in-snow": {
    name: "WL25",
    title: "On your Mark, Get set….",
    description:
      "My turn to Win! OH- let’s just see where that Custer story happened!",
  },
  "wl-lion-portrait": {
    name: "WL26",
    title: "KING",
    description: "Nothing more said!",
  },
  "elephant-line": {
    name: "WL27",
    title: "The End.. but not over!",
    description: "",
  },
  "wl-camel-rider": {
    name: "WL39",
    title: "I brushed my teeth…",
    description: "Where do I spit?",
  },
  "wl-water-visitor": {
    name: "WL30",
    title: "My turn!",
    description: "If a woodchuck could chuck wood...",
  },
};

// This original, high-resolution solo-buffalo record was removed by the old
// position-based duplicate filter. Restore it only during the one-time repair;
// after the migration marker is saved, Ed can delete or edit it normally.
const RECOVERABLE_WILDLIFE_IDS = new Set(["wildebeest"]);

type SiteWithMigrations = SiteContent & { migrations?: string[] };

// Repair the historical split between the public collection lists and the
// master list used by admin. This runs once, then the migration marker makes
// later admin edits authoritative (including intentional deletions).
const ADMIN_PUBLIC_PARITY_MIGRATION =
  "admin-public-gallery-parity-2026-08-28";

function applyAdminPublicParityMigration(content: Content): Content {
  const site = content.site as SiteWithMigrations;
  const alreadyApplied =
    site.migrations?.includes(ADMIN_PUBLIC_PARITY_MIGRATION) ?? false;
  if (alreadyApplied) return content;

  const merged = mergeBundledImports(content);
  const publicLifeObserved = (
    importedLifeObservedJson as unknown as Photo[]
  ).map((photo) => ({ ...photo, published: true }));
  const publicLifeObservedIds = new Set(
    publicLifeObserved.map((photo) => photo.id),
  );

  // Five older Life Observed records exist only in admin. Preserve them rather
  // than deleting them, but record their existing public status explicitly.
  const hiddenLifeObserved = content.photos
    .filter(
      (photo) =>
        photo.collection === "life-observed" &&
        !publicLifeObservedIds.has(photo.id),
    )
    .map((photo, index) => ({
      ...photo,
      published: false,
      order: 6000 + index,
    }));

  return {
    ...merged,
    site: {
      ...site,
      migrations: [
        ...(site.migrations ?? []),
        ADMIN_PUBLIC_PARITY_MIGRATION,
      ],
    } as SiteWithMigrations,
    photos: [
      ...merged.photos.filter(
        (photo) => photo.collection !== "life-observed",
      ),
      ...publicLifeObserved,
      ...hiddenLifeObserved,
    ],
  };
}

function applyWildlifeMigration(content: Content): Content {
  const site = content.site as SiteWithMigrations;
  const alreadyApplied =
    site.migrations?.includes(WILDLIFE_LIST_MIGRATION) ?? false;

  let photos = content.photos;
  if (!alreadyApplied) {
    const existingIds = new Set(photos.map((photo) => photo.id));
    const recover = (photosJson as unknown as Photo[]).filter(
      (photo) =>
        RECOVERABLE_WILDLIFE_IDS.has(photo.id) && !existingIds.has(photo.id),
    );
    if (recover.length > 0) {
      const before = photos.find((photo) => photo.id === "hippo-yawn")?.order;
      const after = photos.find((photo) => photo.id === "deer-twins")?.order;
      const recoveredOrder =
        before !== undefined && after !== undefined
          ? (before + after) / 2
          : photos.reduce(
              (highest, photo) => Math.max(highest, photo.order),
              -1,
            ) + 1;
      photos = [
        ...photos,
        ...recover.map((photo, index) => ({
          ...photo,
          order: recoveredOrder + index / 100,
        })),
      ];
    }
  }

  return {
    ...content,
    site: alreadyApplied
      ? site
      : {
          ...site,
          migrations: [
            ...(site.migrations ?? []),
            WILDLIFE_LIST_MIGRATION,
          ],
        },
    photos: photos
      .filter((photo) => !CONFIRMED_WILDLIFE_DUPLICATES.has(photo.id))
      .map((photo) => {
        if (alreadyApplied || photo.collection !== "wildlife") return photo;
        const correction = WILDLIFE_CORRECTIONS[photo.id];
        return correction ? { ...photo, ...correction } : photo;
      }),
  };
}

// Apply Ed's confirmed BF06 caption once, by stable photo ID. The marker keeps
// later admin edits authoritative after this correction has been saved.
const BEST_FRIENDS_BF06_MIGRATION =
  "best-friends-bf06-caption-2026-08-26";

function applyBestFriendsBf06Migration(content: Content): Content {
  const site = content.site as SiteWithMigrations;
  const alreadyApplied =
    site.migrations?.includes(BEST_FRIENDS_BF06_MIGRATION) ?? false;
  if (alreadyApplied) return content;

  return {
    ...content,
    site: {
      ...site,
      migrations: [
        ...(site.migrations ?? []),
        BEST_FRIENDS_BF06_MIGRATION,
      ],
    } as SiteWithMigrations,
    photos: content.photos.map((photo) =>
      photo.id === "cavalier"
        ? {
            ...photo,
            title: "Small King",
            description: "Large heart",
          }
        : photo,
    ),
  };
}

// Apply Ed's confirmed brown-butterfly caption once, by stable photo ID.
// The correction leaves the photograph's existing number and position alone.
const BEAUTY_FLIGHT_BROWN_CAPTION_MIGRATION =
  "beauty-flight-brown-caption-2026-08-29";

function applyBeautyFlightBrownCaptionMigration(content: Content): Content {
  const site = content.site as SiteWithMigrations;
  const alreadyApplied =
    site.migrations?.includes(BEAUTY_FLIGHT_BROWN_CAPTION_MIGRATION) ?? false;
  if (alreadyApplied) return content;

  return {
    ...content,
    site: {
      ...site,
      migrations: [
        ...(site.migrations ?? []),
        BEAUTY_FLIGHT_BROWN_CAPTION_MIGRATION,
      ],
    } as SiteWithMigrations,
    photos: content.photos.map((photo) =>
      photo.id === "skipper-leaf"
        ? {
            ...photo,
            title: "DID MOTHER NATURE RUN OUT OF PASTELS?",
            description: "BROWN!",
          }
        : photo,
    ),
  };
}

// Number every photograph once, collection by collection, without touching its
// title, description, image, collection, or order. The marker follows the same
// safe pattern as the Wildlife repair: once an admin save stores it in Blob,
// later edits to photo names remain Ed's source of truth.
const PHOTO_NUMBERING_MIGRATION = "photo-numbers-2026-08-20";
const COLLECTION_NUMBER_PREFIXES: Record<string, string> = {
  "minimal-white": "MW",
  watercolor: "WC",
  "places-and-reflections": "PR",
  "the-white-city": "BW",
  wildlife: "WL",
  "natures-beauty-and-flight": "NBF",
  birds: "B",
  icm: "ICM",
  "our-best-friends": "OBF",
  "people-of-the-world": "PW",
  "air-and-water-show": "AWS",
  "natures-fury": "NF",
  "time-preserved": "TP",
  "life-observed": "LO",
};

function applyPhotoNumberMigration(content: Content): Content {
  const site = content.site as SiteWithMigrations;
  const alreadyApplied =
    site.migrations?.includes(PHOTO_NUMBERING_MIGRATION) ?? false;
  if (alreadyApplied) return content;

  const numberById = new Map<string, string>();
  for (const [collection, prefix] of Object.entries(
    COLLECTION_NUMBER_PREFIXES,
  )) {
    content.photos
      .map((photo, index) => ({ photo, index }))
      .filter(({ photo }) => photo.collection === collection)
      .sort(
        (a, b) =>
          a.photo.order - b.photo.order || a.index - b.index,
      )
      .forEach(({ photo }, index) =>
        numberById.set(
          photo.id,
          `${prefix} ${String(index + 1).padStart(2, "0")}`,
        ),
      );
  }

  return {
    ...content,
    site: {
      ...site,
      migrations: [
        ...(site.migrations ?? []),
        PHOTO_NUMBERING_MIGRATION,
      ],
    } as SiteWithMigrations,
    photos: content.photos.map((photo) => {
      const name = numberById.get(photo.id);
      return name ? { ...photo, name } : photo;
    }),
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
    const content = applyPhotoNumberMigration(
      applyBeautyFlightBrownCaptionMigration(
        applyBestFriendsBf06Migration(
          applyWildlifeMigration(
            applyAdminPublicParityMigration(
              (await readLiveBlob()) ?? bundledContent(),
            ),
          ),
        ),
      ),
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
  // A stale admin tab may publish once after this fix deploys. Running the
  // migration here as well makes that first save safe; after its marker is
  // stored, later Ed edits pass through unchanged.
  const safeContent = applyPhotoNumberMigration(
    applyBeautyFlightBrownCaptionMigration(
      applyBestFriendsBf06Migration(
        applyWildlifeMigration(applyAdminPublicParityMigration(content)),
      ),
    ),
  );
  await backupCurrent();
  const result = await put(CONTENT_PATH, JSON.stringify(safeContent), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
  cachedUrl = result.url;
}
