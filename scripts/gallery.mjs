// Create or list private client galleries (the "pooch pics for one person" feature).
//
// Each gallery gets an unguessable token URL (/gallery/<token>/) and an optional
// passcode. Images are copied into public/images/private/<token>/ and served at
// full quality so the client can download them. Galleries are unlisted and
// noindex — the token is the access control, the passcode is a soft second gate.
//
// Usage:
//   node scripts/gallery.mjs --client "The Johnson Family" --dog Marley \
//        --passcode 1234 --intro "Lovely meeting Marley..." \
//        --images ~/Desktop/marley/*.jpg
//   node scripts/gallery.mjs --list
//
// Then: commit public/data/galleries.json + public/images/private/<token>/,
// redeploy, and share the printed URL + passcode with the client.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "public/data/galleries.json");

function readGalleries() {
  try {
    return JSON.parse(fs.readFileSync(DATA, "utf8"));
  } catch {
    return [];
  }
}

function writeGalleries(g) {
  fs.writeFileSync(DATA, JSON.stringify(g, null, 2) + "\n");
}

function slug(s) {
  return (
    (s || "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "client"
  );
}

function sanitize(name) {
  return name.replace(/[^a-z0-9.\-_]/gi, "-").toLowerCase();
}

// Minimal flag parser: --key value, with --images consuming the rest.
function parseArgs(argv) {
  const out = { images: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") out.list = true;
    else if (a === "--images") {
      out.images = argv.slice(i + 1).filter((x) => !x.startsWith("--"));
      i += out.images.length;
    } else if (a.startsWith("--")) {
      out[a.slice(2)] = argv[++i];
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (args.list) {
  const galleries = readGalleries();
  if (!galleries.length) {
    console.log("No galleries yet.");
  } else {
    for (const g of galleries) {
      console.log(
        `• ${g.client}${g.dog ? ` (${g.dog})` : ""}  ` +
          `→ /gallery/${g.token}/  ` +
          `[${g.photos?.length ?? 0} photos${
            g.passcodeHash ? ", passcode set" : ", no passcode"
          }]`,
      );
    }
  }
  process.exit(0);
}

if (!args.client) {
  console.error('Need --client "Name". See the header of this file for usage.');
  process.exit(1);
}

const token = `${slug(args.dog || args.client)}-${crypto
  .randomBytes(5)
  .toString("hex")}`;
const destRel = `public/images/private/${token}`;
const destAbs = path.join(ROOT, destRel);
fs.mkdirSync(destAbs, { recursive: true });

const photos = [];
for (const src of args.images) {
  if (!fs.existsSync(src)) {
    console.warn(`! skipping missing file: ${src}`);
    continue;
  }
  const file = sanitize(path.basename(src));
  fs.copyFileSync(src, path.join(destAbs, file));
  const name = path
    .basename(file, path.extname(file))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  photos.push({
    id: `${token}-${photos.length}`,
    src: `/images/private/${token}/${file}`,
    alt: `${args.dog || args.client} — ${name}`,
    name,
  });
}

const gallery = {
  token,
  client: args.client,
  ...(args.dog ? { dog: args.dog } : {}),
  ...(args.intro ? { intro: args.intro } : {}),
  ...(args.passcode
    ? {
        passcodeHash: crypto
          .createHash("sha256")
          .update(String(args.passcode), "utf8")
          .digest("hex"),
      }
    : {}),
  photos,
};

const galleries = readGalleries();
galleries.push(gallery);
writeGalleries(galleries);

console.log("Created gallery:");
console.log(`  client : ${gallery.client}${args.dog ? ` (${args.dog})` : ""}`);
console.log(`  url    : /gallery/${token}/`);
console.log(`  photos : ${photos.length} → ${destRel}/`);
console.log(`  passcode: ${args.passcode ? args.passcode : "(none)"}`);
console.log(
  "\nNext: commit galleries.json + the image folder, redeploy, then share the url + passcode.",
);
