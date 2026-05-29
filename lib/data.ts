import fs from "node:fs";
import path from "node:path";
import type { Collection, Photo, SiteContent } from "./types";

const dataDir = path.join(process.cwd(), "public", "data");

function read<T>(file: string): T {
  const raw = fs.readFileSync(path.join(dataDir, file), "utf8");
  return JSON.parse(raw) as T;
}

export function getSite(): SiteContent {
  return read<SiteContent>("site.json");
}

export function getCollections(): Collection[] {
  return read<Collection[]>("collections.json");
}

export function getPhotos(): Photo[] {
  return read<Photo[]>("photos.json").sort((a, b) => a.order - b.order);
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
