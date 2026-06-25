// One-time (and safe to re-run) seed of Ed's content into Vercel Blob.
// Reads the current public/data/*.json and writes the combined object to
// content/data.json — the live source of truth the site reads from.
//
//   BLOB_READ_WRITE_TOKEN=... node scripts/seed-blob.mjs
//   (or: vercel env pull .env.local && npm run seed-blob)
import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error(
    "Missing BLOB_READ_WRITE_TOKEN. Run `vercel env pull .env.local` " +
      "(or export it) first.",
  );
  process.exit(1);
}

const read = (f) =>
  JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url)));

const content = {
  site: read("site.json"),
  collections: read("collections.json"),
  photos: read("photos.json"),
  galleries: (() => {
    try {
      return read("galleries.json");
    } catch {
      return [];
    }
  })(),
};

const result = await put("content/data.json", JSON.stringify(content), {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "application/json",
  cacheControlMaxAge: 0,
  token,
});

console.log(
  `Seeded ${content.photos.length} photos / ${content.collections.length} collections -> ${result.url}`,
);
