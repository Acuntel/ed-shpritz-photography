import { list } from "@vercel/blob";
import type { Photo } from "./types";

type BirdCaption = Pick<Photo, "id" | "src" | "title" | "description" | "alt">;

let recoveredCaptions: Promise<BirdCaption[] | null> | undefined;

function captionSignature(photos: Photo[]): string {
  return JSON.stringify(
    photos
      .filter((photo) => photo.collection === "birds")
      .sort((a, b) => a.order - b.order)
      .map(({ id, src, title, description, alt }) => ({
        id,
        src,
        title,
        description,
        alt,
      })),
  );
}

async function findPreviousBirdCaptions(
  current: Photo[],
): Promise<BirdCaption[] | null> {
  try {
    const currentSignature = captionSignature(current);
    const { blobs } = await list({ prefix: "content/backups/" });
    const ordered = blobs.sort((a, b) =>
      b.pathname.localeCompare(a.pathname),
    );

    for (const blob of ordered) {
      const response = await fetch(`${blob.url}?cb=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) continue;

      const content = await response.json();
      const photos = Array.isArray(content?.photos)
        ? (content.photos as Photo[])
        : [];
      const birds = photos
        .filter((photo) => photo.collection === "birds")
        .sort((a, b) => a.order - b.order);

      if (birds.length === 0 || captionSignature(photos) === currentSignature) {
        continue;
      }

      return birds.map(({ id, src, title, description, alt }) => ({
        id,
        src,
        title,
        description,
        alt,
      }));
    }
  } catch {
    // If recovery storage is unavailable, keep the current public captions.
  }
  return null;
}

export async function recoverBirdCaptions(photos: Photo[]): Promise<Photo[]> {
  recoveredCaptions ??= findPreviousBirdCaptions(photos);
  const recovered = await recoveredCaptions;
  if (!recovered) return photos;

  const byId = new Map(recovered.map((photo) => [photo.id, photo]));
  const bySrc = new Map(recovered.map((photo) => [photo.src, photo]));

  return photos.map((photo) => {
    if (photo.collection !== "birds") return photo;
    const caption = byId.get(photo.id) ?? bySrc.get(photo.src);
    return caption ? { ...photo, ...caption } : photo;
  });
}
