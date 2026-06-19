// Pre-generates responsive AVIF + WebP variants and a tiny blur-up placeholder
// for every photograph, then writes public/data/imeta.json. Runs automatically
// before `next build` (see package.json "prebuild"). See MASTER_PROMPT.md §5.
import sharp from "sharp";
import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIRS = ["public/images/gallery", "public/images/uploads"];
const OUT_DIR = path.join(ROOT, "public/images/opt");
const META_FILE = path.join(ROOT, "public/data/imeta.json");
const WIDTHS = [1200, 1600, 2560];
// Cap the full-size variant a little higher than the old 2560 so retina screens
// have real detail to draw when a photo is opened in the lightbox.
const MAX_W = 3000;
const EXT = /\.(jpe?g|png|webp)$/i;

// Bumped from 58/60/64. The old settings were the main reason opened photos
// looked soft; fine-art photography wants a higher floor.
function quality(w) {
  if (w <= 1200) return 66;
  if (w <= 1600) return 70;
  return 74;
}

async function getSiteMeta() {
  try {
    const site = JSON.parse(
      await readFile(path.join(ROOT, "public/data/site.json"), "utf8"),
    );
    const owner = site.ownerName || site.name || "Ed Shpritz";
    return {
      owner,
      watermark: site.watermark === "subtle" ? owner : null,
    };
  } catch {
    return { owner: "Ed Shpritz", watermark: null };
  }
}

// Copyright/author EXIF baked into every web variant. Note this is a deterrent,
// not a control — the real protection is that the print master is never served
// (MASTER_PROMPT.md §5). Metadata can be stripped by a determined downloader.
function copyrightExif(owner) {
  const year = new Date().getFullYear();
  return {
    IFD0: {
      Copyright: `© ${year} ${owner}. All rights reserved.`,
      Artist: owner,
    },
  };
}

function watermarkSvg(width, height, text) {
  const size = Math.max(14, Math.round(width * 0.018));
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width - size}" y="${height - size}" text-anchor="end"
        font-family="Georgia, serif" font-size="${size}"
        fill="white" fill-opacity="0.28">${text}</text>
    </svg>`,
  );
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const { owner, watermark } = await getSiteMeta();
  const exif = copyrightExif(owner);
  const manifest = {};
  let count = 0;

  for (const rel of SRC_DIRS) {
    const dir = path.join(ROOT, rel);
    if (!existsSync(dir)) continue;
    const files = (await readdir(dir)).filter((f) => EXT.test(f));

    for (const file of files) {
      const input = path.join(dir, file);
      const base = file.replace(EXT, "");
      const meta = await sharp(input).metadata();
      const srcW = meta.width ?? WIDTHS[0];
      const srcH = meta.height ?? srcW;

      // Variant widths: standard steps that fit, plus a capped full-size.
      const widths = [
        ...new Set([
          ...WIDTHS.filter((w) => w <= srcW),
          Math.min(srcW, MAX_W),
        ]),
      ].sort((a, b) => a - b);
      const maxW = widths[widths.length - 1];

      for (const w of widths) {
        const pipe = sharp(input)
          .resize({ width: w, withoutEnlargement: true })
          .toColorspace("srgb")
          // Downscaling always softens; a gentle unsharp mask restores the
          // crispness Ed expects when a picture is opened full-screen.
          .sharpen({ sigma: 0.7 });

        if (watermark && w === maxW) {
          const h = Math.round((srcH / srcW) * w);
          pipe.composite([{ input: watermarkSvg(w, h, watermark), top: 0, left: 0 }]);
        }

        const buf = await pipe.toBuffer();
        await sharp(buf)
          .withExif(exif)
          .avif({ quality: quality(w) })
          .toFile(path.join(OUT_DIR, `${base}-${w}.avif`));
        await sharp(buf)
          .withExif(exif)
          .webp({ quality: quality(w) + 8 })
          .toFile(path.join(OUT_DIR, `${base}-${w}.webp`));
      }

      const lqipBuf = await sharp(input)
        .resize({ width: 24 })
        .blur()
        .jpeg({ quality: 40 })
        .toBuffer();
      const lqip = `data:image/jpeg;base64,${lqipBuf.toString("base64")}`;

      manifest[base] = { widths, lqip, width: srcW, height: srcH };
      count += 1;
    }
  }

  await writeFile(META_FILE, JSON.stringify(manifest, null, 2));
  console.log(
    `optimize: ${count} image(s) → ${OUT_DIR}` +
      (watermark ? " (subtle watermark)" : ""),
  );
}

run().catch((e) => {
  console.error("optimize failed:", e);
  process.exit(1);
});
